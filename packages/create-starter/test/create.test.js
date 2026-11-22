import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";

import { create, fromLocalDir, parseCliArgs, validate } from "../lib/create.js";

const FIXTURE_ROOT = new URL("./fixtures", import.meta.url).pathname;

describe("parseCliArgs", () => {
  test("テンプレート名とフォルダ名を受け取る", () => {
    assert.deepEqual(parseCliArgs(["vite", "my-site"]), { template: "vite", dir: "my-site", css: undefined, ref: "main", help: false });
  });

  test("--ref でタグやブランチを指定できる", () => {
    assert.deepEqual(parseCliArgs(["--ref", "v1.0.0", "astro", "site"]), { template: "astro", dir: "site", css: undefined, ref: "v1.0.0", help: false });
  });

  test("--css で CSS の方式を指定できる", () => {
    assert.deepEqual(parseCliArgs(["vite", "site", "--css", "tailwind"]), { template: "vite", dir: "site", css: "tailwind", ref: "main", help: false });
  });

  test("足りない引数は undefined のまま返す（あとで対話で聞く）", () => {
    assert.deepEqual(parseCliArgs([]), { template: undefined, dir: undefined, css: undefined, ref: "main", help: false });
  });

  test("知らないオプションは、日本語のエラーと使い方を出す", () => {
    assert.throws(() => parseCliArgs(["--foo", "vite", "x"]), /オプション「--foo」はありません。\n使い方:/);
  });

  test("--help と -h を受け取る", () => {
    assert.equal(parseCliArgs(["--help"]).help, true);
    assert.equal(parseCliArgs(["-h"]).help, true);
    assert.equal(parseCliArgs(["vite", "x"]).help, false);
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
    await assert.rejects(validate({ template: "laravel", css: "vanilla", dir: "x", cwd }), /laravel.*wordpress, vite, astro/);
  });

  test("存在しない CSS の方式はエラーにし、選べる方式を示す", async () => {
    await assert.rejects(validate({ template: "vite", css: "sass", dir: "x", cwd }), /sass.*vanilla, tailwind/);
  });

  test("空でないフォルダはエラーにする", async () => {
    await mkdir(join(cwd, "site"));
    await writeFile(join(cwd, "site/index.html"), "");
    await assert.rejects(validate({ template: "vite", css: "vanilla", dir: "site", cwd }), /空ではありません/);
  });

  test("空のフォルダなら通す", async () => {
    await mkdir(join(cwd, "site"));
    await validate({ template: "vite", css: "vanilla", dir: "site", cwd });
  });

  test("package.json の name に使えないフォルダ名はエラーにする", async () => {
    await assert.rejects(validate({ template: "vite", css: "vanilla", dir: "My Site", cwd }), /package\.json の name/);
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

  const createSite = (template, css = "vanilla") =>
    create({
      template,
      css,
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

  test("Tailwind CSS を選ぶと、差分を重ね、差分の指示どおりに不要なファイルを消す", async () => {
    await createSite("vite", "tailwind");
    const site = join(cwd, "my-site");
    assert.deepEqual(JSON.parse(await readFile(join(site, "package.json"), "utf8")).devDependencies, { tailwindcss: "^4.0.0" });
    assert.equal(await readFile(join(site, "src/index.css"), "utf8"), '@import "tailwindcss";\n');
    assert.equal(await readFile(join(site, ".editorconfig"), "utf8"), "root = true\n");
    await assert.rejects(access(join(site, "src/reset.css")));
    await assert.rejects(access(join(site, ".variant.json")));
  });

  test("Vanilla CSS では差分を重ねない", async () => {
    await createSite("vite", "vanilla");
    const site = join(cwd, "my-site");
    await access(join(site, "src/reset.css"));
    await assert.rejects(access(join(site, "src/index.css")));
  });

  test("最初のコミットのメッセージに CSS の方式を残す", async () => {
    await createSite("vite", "tailwind");
    assert.ok(commands.at(-1).startsWith("git commit --no-verify -m chore: @glanz-creative/starter の vite テンプレート（Tailwind CSS）から作成"));
  });

  test("git init → mise → pnpm install → 最初のコミットの順に実行し、push はしない", async () => {
    await createSite("vite");
    assert.deepEqual(commands, [
      "git init -b main",
      "mise trust",
      "mise install",
      "mise exec -- pnpm install --frozen-lockfile",
      "git add -A",
      "git commit --no-verify -m chore: @glanz-creative/starter の vite テンプレート（Vanilla CSS）から作成 -m 参照元: GLANZ-CREATIVE/starter@main",
    ]);
  });

  test("取得元のコミットがわかれば、最初のコミットの本文に参照元として残す", async () => {
    await create({
      template: "vite",
      css: "vanilla",
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
      css: "vanilla",
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
      css: "vanilla",
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
