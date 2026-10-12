import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import { create, fromLocalDir, parseCliArgs, validate } from "../lib/create.js";

const FIXTURE_ROOT = new URL("./fixtures", import.meta.url).pathname;

describe("parseCliArgs", () => {
  test("テンプレート名とフォルダ名を受け取る", () => {
    assert.deepEqual(parseCliArgs(["vite", "my-site"]), { template: "vite", dir: "my-site", ref: "main" });
  });

  test("--ref でタグやブランチを指定できる", () => {
    assert.deepEqual(parseCliArgs(["--ref", "v1.0.0", "astro", "site"]), { template: "astro", dir: "site", ref: "v1.0.0" });
  });

  test("足りない引数は undefined のまま返す（あとで対話で聞く）", () => {
    assert.deepEqual(parseCliArgs([]), { template: undefined, dir: undefined, ref: "main" });
  });

  test("知らないオプションはエラーにする", () => {
    assert.throws(() => parseCliArgs(["--foo", "vite", "x"]));
  });
});

describe("validate", () => {
  let cwd;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), "create-starter-"));
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  test("存在しないテンプレート名はエラーにし、選べる名前を示す", async () => {
    await assert.rejects(validate({ template: "laravel", dir: "x", cwd }), /laravel.*wordpress, vite, astro/);
  });

  test("空でないフォルダはエラーにする", async () => {
    await mkdir(join(cwd, "site"));
    await writeFile(join(cwd, "site/index.html"), "");
    await assert.rejects(validate({ template: "vite", dir: "site", cwd }), /空ではありません/);
  });

  test("空のフォルダなら通す", async () => {
    await mkdir(join(cwd, "site"));
    await validate({ template: "vite", dir: "site", cwd });
  });

  test("package.json の name に使えないフォルダ名はエラーにする", async () => {
    await assert.rejects(validate({ template: "vite", dir: "My Site", cwd }), /package\.json の name/);
  });
});

describe("create", () => {
  let cwd;
  let commands;

  const run = async (command, args, options) => {
    commands.push([command, ...args].join(" "));
    assert.equal(options.cwd, join(cwd, "my-site"));
  };

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), "create-starter-"));
    commands = [];
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  const createSite = (template) =>
    create({
      template,
      dir: "my-site",
      ref: "main",
      cwd,
      fetchTemplate: fromLocalDir(FIXTURE_ROOT),
      run,
      hasCommand: async () => true,
    });

  test("ドットファイルも含めて展開し、name だけを案件名に置き換える（ほかの書式は変えない）", async () => {
    await createSite("vite");
    assert.equal(
      await readFile(join(cwd, "my-site/package.json"), "utf8"),
      '{\n  "name": "my-site",\n  "private": true,\n  "browserslist": ["> 0.5%", "not dead"]\n}\n',
    );
    assert.equal(await readFile(join(cwd, "my-site/.gitignore"), "utf8"), "node_modules/\n");
    assert.equal(await readFile(join(cwd, "my-site/.editorconfig"), "utf8"), "root = true\n");
  });

  test("git init → mise → pnpm install → 最初のコミットの順に実行し、push はしない", async () => {
    await createSite("vite");
    assert.deepEqual(commands, [
      "git init -b main",
      "mise trust",
      "mise install",
      "mise exec -- pnpm install --frozen-lockfile",
      "git add -A",
      "git commit --no-verify -m chore: @glanz-creative/starter の vite テンプレートから作成 -m 参照元: GLANZ-CREATIVE/starter@main",
    ]);
  });

  test("取得元のコミットがわかれば、最初のコミットの本文に参照元として残す", async () => {
    await create({
      template: "vite",
      dir: "my-site",
      ref: "main",
      cwd,
      fetchTemplate: async (args) => {
        await fromLocalDir(FIXTURE_ROOT)(args);
        return { commit: "0123456789abcdef0123456789abcdef01234567" };
      },
      run,
      hasCommand: async () => true,
    });
    assert.ok(commands.at(-1).endsWith("-m 参照元: GLANZ-CREATIVE/starter@main (0123456789abcdef0123456789abcdef01234567)"));
  });

  test("コミットがわからなくても ref だけは残す", async () => {
    await createSite("vite");
    assert.ok(commands.at(-1).endsWith("-m 参照元: GLANZ-CREATIVE/starter@main"));
  });

  test("mise がなければ警告して pnpm を直接使う", async () => {
    const { warnings } = await create({
      template: "vite",
      dir: "my-site",
      ref: "main",
      cwd,
      fetchTemplate: fromLocalDir(FIXTURE_ROOT),
      run,
      hasCommand: async (name) => name !== "mise",
    });
    assert.ok(commands.includes("pnpm install --frozen-lockfile"));
    assert.ok(!commands.some((c) => c.startsWith("mise")));
    assert.ok(warnings.some((warning) => warning.includes("mise が見つかりません")));
  });

  test("取得とインストールの順に進捗を出す", async () => {
    const messages = [];
    await create({
      template: "vite",
      dir: "my-site",
      ref: "main",
      cwd,
      fetchTemplate: fromLocalDir(FIXTURE_ROOT),
      run,
      hasCommand: async () => true,
      progress: (message) => messages.push(message),
    });
    assert.deepEqual(messages, ["テンプレートを取得しています", "依存関係をインストールしています"]);
  });
});
