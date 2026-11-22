import assert from "node:assert/strict";
import { stripVTControlCharacters } from "node:util";
import { describe, test } from "node:test";

import { PromptCancelled, ask } from "../lib/prompt.js";
import { formatNextSteps } from "../lib/templates.js";

function prompts(handlers) {
  const calls = [];
  return {
    calls,
    isCancel: (value) => value === Symbol.for("cancel"),
    async select(question) {
      calls.push(["select", question]);
      return handlers.select(question);
    },
    async text(question) {
      calls.push(["text", question]);
      return handlers.text(question);
    },
  };
}

describe("ask", () => {
  test("テンプレート・プロジェクト名・CSS の方式が揃っていれば聞かない", async () => {
    const ui = prompts({
      select: () => {
        throw new Error("select");
      },
      text: () => {
        throw new Error("text");
      },
    });

    assert.deepEqual(await ask({ template: "vite", dir: "my-site", css: "tailwind", isTTY: false, prompts: ui }), {
      template: "vite",
      dir: "my-site",
      css: "tailwind",
    });
    assert.deepEqual(ui.calls, []);
  });

  test("対話できないときは使い方を出して終わる", async () => {
    await assert.rejects(ask({ isTTY: false, prompts: prompts({}) }), /使い方/);
  });

  test("対話できないときは CSS の方式も引数で必要", async () => {
    await assert.rejects(ask({ template: "vite", dir: "my-site", isTTY: false, prompts: prompts({}) }), /--css <vanilla \/ tailwind>/);
  });

  test("未指定ならプロジェクト名、テンプレート、CSS の方式の順に聞く", async () => {
    const answers = ["astro", "tailwind"];
    const ui = prompts({
      text: () => "my-site",
      select: () => answers.shift(),
    });

    assert.deepEqual(await ask({ isTTY: true, prompts: ui }), { template: "astro", dir: "my-site", css: "tailwind" });
    assert.deepEqual(
      ui.calls.map(([kind, question]) => [kind, question.message]),
      [
        ["text", "プロジェクト名は？"],
        ["select", "どのテンプレートで始めますか？"],
        ["select", "CSS はどの方式で書きますか？"],
      ],
    );
    assert.deepEqual(
      ui.calls[2][1].options.map((option) => ({
        value: option.value,
        label: stripVTControlCharacters(option.label),
      })),
      [
        { value: "vanilla", label: "Vanilla CSS  reset.css と @layer で書く" },
        { value: "tailwind", label: "Tailwind CSS  ユーティリティクラスで書く" },
      ],
    );
    assert.equal(ui.calls[0][1].placeholder, "my-site");
    assert.equal(ui.calls[0][1].initialValue, "my-site");
    assert.deepEqual(
      ui.calls[1][1].options.map((option) => ({
        value: option.value,
        label: stripVTControlCharacters(option.label),
      })),
      [
        { value: "wordpress", label: "WordPress  Docker が必要なテーマ開発" },
        { value: "vite", label: "Vite  HTML の静的サイト" },
        { value: "astro", label: "Astro  コンポーネントの静的サイト" },
        { value: "webapp", label: "Web アプリ  React + Hono のモノレポ（Vite+）" },
      ],
    );
  });

  test("テンプレートと CSS の方式が指定されていればプロジェクト名だけ聞く", async () => {
    const ui = prompts({
      text: () => "my-site",
      select: () => {
        throw new Error("select");
      },
    });

    assert.deepEqual(await ask({ template: "vite", css: "vanilla", isTTY: true, prompts: ui }), { template: "vite", dir: "my-site", css: "vanilla" });
    assert.deepEqual(
      ui.calls.map(([kind]) => kind),
      ["text"],
    );
  });

  test("存在しない CSS の方式なら、選び直す", async () => {
    const ui = prompts({
      select: () => "vanilla",
      text: () => {
        throw new Error("text");
      },
    });

    assert.deepEqual(await ask({ template: "vite", dir: "my-site", css: "sass", isTTY: true, prompts: ui }), { template: "vite", dir: "my-site", css: "vanilla" });
    assert.match(ui.calls[0][1].message, /sass/);
  });

  test("存在しないテンプレート名なら、選び直してからプロジェクト名を聞く", async () => {
    const ui = prompts({
      select: () => "vite",
      text: () => "my-site",
    });

    await ask({ template: "laravel", css: "vanilla", isTTY: true, prompts: ui });
    assert.equal(ui.calls[0][0], "select");
    assert.match(ui.calls[0][1].message, /laravel/);
    assert.equal(ui.calls[1][0], "text");
  });

  test("プロジェクト名は package.json の name に使えるものだけ通す", async () => {
    let validate;
    const ui = prompts({
      text: (question) => {
        validate = question.validate;
        return "my-site";
      },
      select: () => "vite",
    });

    await ask({ template: "vite", css: "vanilla", isTTY: true, prompts: ui });
    assert.equal(validate(""), "プロジェクト名を入力してください。");
    assert.match(validate("My Site"), /package\.json の name/);
    assert.equal(validate("my-site"), undefined);
    assert.equal(validate("  my-site  "), undefined);
  });

  test("途中でやめたら作成を中止する", async () => {
    const ui = prompts({
      text: () => Symbol.for("cancel"),
      select: () => {
        throw new Error("select");
      },
    });

    await assert.rejects(ask({ isTTY: true, prompts: ui }), PromptCancelled);
  });
});

describe("formatNextSteps", () => {
  test("起動コマンドを、移動してから実行する順で出す", () => {
    assert.equal(formatNextSteps("vite", "my-site"), "cd my-site\npnpm dev");
    assert.equal(formatNextSteps("astro", "my-site"), "cd my-site\npnpm dev");
  });

  test("wordpress では Docker を起動してから pnpm start するよう案内する", () => {
    assert.equal(formatNextSteps("wordpress", "client"), "cd client\npnpm start\n\nDocker を起動してから実行してください。");
  });
});
