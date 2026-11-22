import { basename } from "node:path";

import * as p from "@clack/prompts";
import pc from "picocolors";

import { invalidPackageNameReason } from "./create.js";
import { CSS_METHOD_NAMES, CSS_METHODS, TEMPLATE_NAMES, TEMPLATES, USAGE } from "./templates.js";

function paint(hex) {
  if (!pc.isColorSupported) return (text) => text;
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return (text) => `\u001B[38;2;${r};${g};${b}m${text}\u001B[39m`;
}

const PRESENTATION = {
  wordpress: { title: "WordPress", hint: "Docker が必要なテーマ開発", color: paint("#21759B") },
  vite: { title: "Vite", hint: "HTML の静的サイト", color: paint("#646CFF") },
  astro: { title: "Astro", hint: "コンポーネントの静的サイト", color: paint("#FF5D01") },
  webapp: { title: "Web アプリ", hint: "React + Hono のモノレポ（Vite+）", color: paint("#61DAFB") },
};

const CSS_HINTS = {
  vanilla: "reset.css と @layer で書く",
  tailwind: "ユーティリティクラスで書く",
};

export class PromptCancelled extends Error {
  constructor() {
    super("作成を中止しました。");
    this.name = "PromptCancelled";
  }
}

function templateOptions() {
  return TEMPLATE_NAMES.map((name) => {
    const { title, hint, color } = PRESENTATION[name];
    return { value: name, label: `${color(title)}  ${pc.dim(hint)}` };
  });
}

function templateQuestion(template) {
  return template ? `「${template}」はありません。どのテンプレートで始めますか？` : "どのテンプレートで始めますか？";
}

function cssOptions() {
  return CSS_METHOD_NAMES.map((name) => ({ value: name, label: `${CSS_METHODS[name].title}  ${pc.dim(CSS_HINTS[name])}` }));
}

function cssQuestion(css) {
  return css ? `CSS の方式「${css}」はありません。どの方式で書きますか？` : "CSS はどの方式で書きますか？";
}

function nameQuestion() {
  return {
    message: "プロジェクト名は？",
    placeholder: "my-site",
    initialValue: "my-site",
    validate(value) {
      const name = value.trim();
      if (!name) return "プロジェクト名を入力してください。";
      return invalidPackageNameReason(basename(name));
    },
  };
}

async function answer(value, { isCancel }) {
  if (isCancel(value)) throw new PromptCancelled();
  return value;
}

const clack = {
  select: (question) => p.select({ ...question, showInstructions: false }),
  text: (question) => p.text(question),
  isCancel: p.isCancel,
};

export async function ask({ template, dir, css, isTTY, prompts = clack }) {
  if (TEMPLATES[template] && dir && CSS_METHODS[css]) return { template, dir, css };
  if (!isTTY) {
    // 値の誤りは、展開前の検証が「〇〇はありません。選べるのは…」と具体的に伝える
    if (template && dir && css) return { template, dir, css };
    throw new Error(`引数が足りません。\n使い方: ${USAGE}`);
  }

  const known = Boolean(TEMPLATES[template]);
  // 未指定のときは create-vite と同じく名前から聞く。渡されたテンプレート名が不正なときだけ先に選び直す。
  if (!dir && (!template || known)) dir = (await answer(await prompts.text(nameQuestion()), prompts)).trim();
  if (!known) template = await answer(await prompts.select({ message: templateQuestion(template), options: templateOptions() }), prompts);
  if (!dir) dir = (await answer(await prompts.text(nameQuestion()), prompts)).trim();
  if (!CSS_METHODS[css]) css = await answer(await prompts.select({ message: cssQuestion(css), options: cssOptions() }), prompts);

  return { template, dir, css };
}
