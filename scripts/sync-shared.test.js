import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import { check, GITIGNORE_MARKER, renderGitignore, resetCssTargets, sync } from "./sync-shared.js";

describe("renderGitignore", () => {
  test("目印がなければ既存の中身をテンプレート固有の部分として残す", () => {
    const out = renderGitignore("node_modules/\n", "dist/\n");
    assert.equal(out, `node_modules/\n\n${GITIGNORE_MARKER}\ndist/\n`);
  });

  test("目印より上は base で置き換え、下は残す", () => {
    const current = `old/\n\n${GITIGNORE_MARKER}\ndist/\n`;
    assert.equal(renderGitignore("new/\n", current), `new/\n\n${GITIGNORE_MARKER}\ndist/\n`);
  });

  test("何度かけても同じ結果になる", () => {
    const once = renderGitignore("a\n", "b\n");
    assert.equal(renderGitignore("a\n", once), once);
  });
});

describe("resetCssTargets", () => {
  test("null のテンプレートには配らない", () => {
    assert.deepEqual(resetCssTargets(["vite", "astro"], { vite: "src/reset.css", astro: null }), ["templates/vite/src/reset.css"]);
  });

  test("配り先を決めていないテンプレートがあればエラーにする", () => {
    assert.throws(() => resetCssTargets(["vite", "astro"], { vite: "src/reset.css" }), /astro/);
  });
});

describe("sync と check", () => {
  let root;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "starter-shared-"));
    await cp(new URL("./fixtures/repo", import.meta.url), root, { recursive: true });
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  test("sync 前はずれを報告し、sync 後は何も報告しない", async () => {
    assert.notDeepEqual(await check(root), []);
    await sync(root);
    assert.deepEqual(await check(root), []);
  });

  test("reset.css は astro に配らない", async () => {
    await sync(root);
    await assert.rejects(readFile(join(root, "templates/astro/src/assets/css/base/reset.css")));
  });

  test("テンプレートの共通ファイルを書き換えると報告する", async () => {
    await sync(root);
    await writeFile(join(root, "templates/vite/.editorconfig"), "changed\n");
    assert.deepEqual(await check(root), ["templates/vite/.editorconfig が shared/.editorconfig と一致しない"]);
  });

  test("packageManager が .mise.toml の pnpm と違うと報告する", async () => {
    await sync(root);
    const path = join(root, "templates/astro/package.json");
    const pkg = JSON.parse(await readFile(path, "utf8"));
    pkg.packageManager = "pnpm@10.0.0";
    await writeFile(path, JSON.stringify(pkg));
    assert.deepEqual(await check(root), ["templates/astro/package.json の packageManager が pnpm@12.12.1 ではない（pnpm@10.0.0）"]);
  });

  test("engines.node が Node のメジャー版とそろっていないと報告する", async () => {
    await sync(root);
    const path = join(root, "templates/astro/package.json");
    const pkg = JSON.parse(await readFile(path, "utf8"));
    pkg.engines.node = ">=22.12.0";
    await writeFile(path, JSON.stringify(pkg));
    assert.deepEqual(await check(root), ["templates/astro/package.json の engines.node が >=24 ではない（>=22.12.0）"]);
  });

  test("lefthook の版がテンプレート間でそろっていないと報告する", async () => {
    await sync(root);
    const path = join(root, "templates/vite/package.json");
    const pkg = JSON.parse(await readFile(path, "utf8"));
    pkg.devDependencies.lefthook = "^2.0.0";
    await writeFile(path, JSON.stringify(pkg));
    assert.deepEqual(await check(root), ["lefthook の版がテンプレート間でそろっていない（wordpress: ^2.2.1, vite: ^2.0.0, astro: ^2.2.1）"]);
  });

  test("templates/ にあって TEMPLATES にないフォルダを報告する", async () => {
    await sync(root);
    await mkdir(join(root, "templates/laravel"));
    assert.deepEqual(await check(root), ["templates/laravel が create-starter の TEMPLATES にない"]);
  });

  test("ルートの pnpm workspace に templates/ を入れると報告する", async () => {
    await sync(root);
    await writeFile(join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n  - templates/*\n");
    assert.deepEqual(await check(root), ["pnpm-workspace.yaml に templates/ を入れない（各テンプレートは自分の lockfile を持つ単体のプロジェクト）"]);
  });

  test("整形の設定（行幅・引用符・末尾カンマ）がそろっていないと報告する", async () => {
    await sync(root);
    await writeFile(join(root, "templates/astro/.prettierrc.mjs"), 'export default { printWidth: 80, singleQuote: true, trailingComma: "es5" };\n');
    await writeFile(
      join(root, "templates/vite/biome.json"),
      '{ "formatter": { "lineWidth": 150 }, "javascript": { "formatter": { "quoteStyle": "single", "trailingCommas": "all" } } }\n',
    );
    assert.deepEqual(await check(root), [
      "templates/vite/biome.json の引用符が double ではない（single）",
      "templates/astro/.prettierrc.mjs の行幅が 150 ではない（80）",
      "templates/astro/.prettierrc.mjs の引用符が double ではない（single）",
      "templates/astro/.prettierrc.mjs の末尾カンマが all ではない（es5）",
    ]);
  });

  test("pre-commit が整形結果をコミットに含めない（stage_fixed がない）と報告する", async () => {
    await sync(root);
    await writeFile(join(root, "templates/astro/lefthook.yml"), "pre-commit:\n  jobs:\n    - run: x\n");
    assert.deepEqual(await check(root), ["templates/astro/lefthook.yml の pre-commit に stage_fixed: true がない（整形結果をコミットに含める）"]);
  });

  test("lefthook.yml がない、または commands: を使っていると報告する", async () => {
    await sync(root);
    await rm(join(root, "templates/vite/lefthook.yml"));
    await writeFile(join(root, "templates/astro/lefthook.yml"), "pre-commit:\n  commands:\n    a:\n      run: x\n");
    assert.deepEqual(await check(root), [
      "templates/vite/lefthook.yml がない",
      "templates/astro/lefthook.yml が commands: を使っている（jobs: に統一する）",
    ]);
  });
});
