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
    await writeFile(path, JSON.stringify(pkg, null, 2));
    assert.deepEqual(await check(root), [
      "templates/astro/package.json の packageManager が pnpm@12.12.1 ではない（pnpm@10.0.0）",
      'variants/tailwind/astro/package.json に templates/astro/package.json の「"packageManager": "pnpm@10.0.0"」が入っていない',
    ]);
  });

  test("engines.node が Node のメジャー版とそろっていないと報告する", async () => {
    await sync(root);
    const path = join(root, "templates/astro/package.json");
    const pkg = JSON.parse(await readFile(path, "utf8"));
    pkg.engines.node = ">=22.12.0";
    await writeFile(path, JSON.stringify(pkg, null, 2));
    assert.deepEqual(await check(root), [
      "templates/astro/package.json の engines.node が >=24 ではない（>=22.12.0）",
      'variants/tailwind/astro/package.json に templates/astro/package.json の「"node": ">=22.12.0"」が入っていない',
    ]);
  });

  test("lefthook の版がテンプレート間でそろっていないと報告する", async () => {
    await sync(root);
    const path = join(root, "templates/vite/package.json");
    const pkg = JSON.parse(await readFile(path, "utf8"));
    pkg.devDependencies.lefthook = "^2.0.0";
    await writeFile(path, JSON.stringify(pkg, null, 2));
    assert.deepEqual(await check(root), [
      "lefthook の版がテンプレート間でそろっていない（wordpress: ^2.2.1, vite: ^2.0.0, astro: ^2.2.1）",
      'variants/tailwind/vite/package.json に templates/vite/package.json の「"lefthook": "^2.0.0"」が入っていない',
    ]);
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
    await writeFile(
      join(root, "templates/webapp/vite.config.ts"),
      'import { defineConfig } from "vite-plus";\n\nexport default defineConfig({ staged: { "*": "vp check --fix" }, fmt: { singleQuote: true } });\n',
    );
    assert.deepEqual(await check(root), [
      "templates/vite/biome.json の引用符が double ではない（single）",
      "templates/astro/.prettierrc.mjs の行幅が 150 ではない（80）",
      "templates/astro/.prettierrc.mjs の引用符が double ではない（single）",
      "templates/astro/.prettierrc.mjs の末尾カンマが all ではない（es5）",
      "templates/webapp/vite.config.ts の行幅が 150 ではない（100）",
      "templates/webapp/vite.config.ts の引用符が double ではない（single）",
    ]);
  });

  test("Vite+ のフックの pre-commit がない、または vp staged を実行しないと報告する", async () => {
    await sync(root);
    const hook = join(root, "templates/webapp/.vite-hooks/pre-commit");
    await writeFile(hook, "vp check\n");
    assert.deepEqual(await check(root), ["templates/webapp/.vite-hooks/pre-commit が vp staged を実行しない（整形結果をコミットに含める）"]);
    await rm(hook);
    assert.deepEqual(await check(root), ["templates/webapp/.vite-hooks/pre-commit がない"]);
  });

  test("vite.config.ts の staged が vp check --fix を実行しないと報告する", async () => {
    await sync(root);
    await writeFile(join(root, "templates/webapp/vite.config.ts"), 'import { defineConfig } from "vite-plus";\n\nexport default defineConfig({ fmt: { printWidth: 150 } });\n');
    assert.deepEqual(await check(root), ["templates/webapp/vite.config.ts の staged が vp check --fix を実行しない（整形結果をコミットに含める）"]);
  });

  test("ルートの vite.config.ts が vite-plus 以外を import すると、読めない理由を報告する", async () => {
    await sync(root);
    await writeFile(
      join(root, "templates/webapp/vite.config.ts"),
      'import react from "@vitejs/plugin-react";\nimport { defineConfig } from "vite-plus";\n\nexport default defineConfig({ plugins: [react()] });\n',
    );
    assert.deepEqual(await check(root), [
      "templates/webapp/vite.config.ts を読み込めない（ルートの vite.config.ts は vite-plus 以外を import しない。Vite のプラグインは apps/web/vite.config.ts に書く）",
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

  test("差分のファイルが、共通部分に足された行を含んでいないと報告する", async () => {
    await sync(root);
    const path = join(root, "templates/vite/package.json");
    const pkg = JSON.parse(await readFile(path, "utf8"));
    await writeFile(path, JSON.stringify({ ...pkg, private: true }, null, 2));
    assert.deepEqual(await check(root), ['variants/tailwind/vite/package.json に templates/vite/package.json の「"private": true」が入っていない']);
  });

  test("差分の package.json を extends に入れていないと報告する", async () => {
    await sync(root);
    const manifest = join(root, "variants/tailwind/vite/.variant.json");
    await writeFile(manifest, JSON.stringify({ remove: ["src/assets/css/base/reset.css"], extends: [] }));
    assert.deepEqual(await check(root), ["variants/tailwind/vite/.variant.json の extends に package.json がない（共通部分の変更を取り込めているか検査できない）"]);
  });

  test("差分が reset.css を消していないと報告する", async () => {
    await sync(root);
    await writeFile(join(root, "variants/tailwind/astro/.variant.json"), JSON.stringify({ remove: [], extends: ["package.json"] }));
    assert.deepEqual(await check(root), ["variants/tailwind/astro/.variant.json の remove に src/styles/reset.css がない（tailwind では reset.css を配らない）"]);
  });

  test("共通部分にないファイルを消そうとしていると報告する", async () => {
    await sync(root);
    await writeFile(
      join(root, "variants/tailwind/astro/.variant.json"),
      JSON.stringify({ remove: ["src/styles/reset.css", "src/styles/kiso.css"], extends: ["package.json"] }),
    );
    assert.deepEqual(await check(root), ["variants/tailwind/astro/.variant.json の remove にある src/styles/kiso.css が templates/astro にない"]);
  });

  test("shared/ から配るファイルを差分に置くと報告する", async () => {
    await sync(root);
    await writeFile(join(root, "variants/tailwind/vite/.editorconfig"), "root = true\n");
    assert.deepEqual(await check(root), ["variants/tailwind/vite/.editorconfig は shared/ から配るファイルなので差分に置かない"]);
  });

  test("差分の指示書がない、または TEMPLATES にない差分のフォルダを報告する", async () => {
    await sync(root);
    await rm(join(root, "variants/tailwind/webapp/.variant.json"));
    await mkdir(join(root, "variants/tailwind/laravel"));
    assert.deepEqual(await check(root), [
      "variants/tailwind/webapp/.variant.json がない",
      "variants/tailwind/laravel が create-starter の TEMPLATES にない",
    ]);
  });

  test("pnpm-workspace.yaml の overrides に上限（<N）のない範囲があると報告する", async () => {
    await sync(root);
    await writeFile(
      join(root, "templates/wordpress/pnpm-workspace.yaml"),
      'allowBuilds:\n  sharp: true\n\noverrides:\n  minimatch: ">=3.1.4"\n  qs: ">=6.16.0 <7"\n  vite@*: "catalog:"\n',
    );
    assert.deepEqual(await check(root), [
      'templates/wordpress/pnpm-workspace.yaml の overrides の minimatch: ">=3.1.4" に上限（<N）がない（メジャー版を黙って越える）',
    ]);
  });
});
