import { basename } from "node:path";

import * as p from "@clack/prompts";
import pc from "picocolors";

import { invalidPackageNameReason } from "./create.js";
import { TEMPLATE_NAMES, TEMPLATES } from "./templates.js";

const USAGE = `使い方: pnpm create @glanz-creative/starter <テンプレート名> <プロジェクト名> [--ref <タグかブランチ>]
テンプレート名: ${TEMPLATE_NAMES.join(" / ")}`;

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

export async function ask({ template, dir, isTTY, prompts = clack }) {
  if (TEMPLATES[template] && dir) return { template, dir };
  if (!isTTY) throw new Error(`引数が足りません。\n${USAGE}`);

  const known = Boolean(TEMPLATES[template]);
  // 未指定のときは create-vite と同じく名前から聞く。渡されたテンプレート名が不正なときだけ先に選び直す。
  if (!dir && (!template || known)) dir = (await answer(await prompts.text(nameQuestion()), prompts)).trim();
  if (!known) template = await answer(await prompts.select({ message: templateQuestion(template), options: templateOptions() }), prompts);
  if (!dir) dir = (await answer(await prompts.text(nameQuestion()), prompts)).trim();

  return { template, dir };
}
