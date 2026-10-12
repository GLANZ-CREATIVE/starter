#!/usr/bin/env node
import { spawn } from "node:child_process";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

import { create, fromGitHub, fromLocalDir, parseCliArgs } from "./lib/create.js";
import { TEMPLATE_NAMES, TEMPLATES } from "./lib/templates.js";

const USAGE = `使い方: pnpm create @glanz-creative/starter <テンプレート名> <フォルダ名> [--ref <タグかブランチ>]
テンプレート名: ${TEMPLATE_NAMES.join(" / ")}`;

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} が失敗しました（終了コード ${code}）`))));
  });
}

function hasCommand(command) {
  return new Promise((resolve) => {
    const child = spawn(command, ["--version"], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("exit", (code) => resolve(code === 0));
  });
}

async function ask({ template, dir }) {
  if (template && dir) return { template, dir };
  if (!stdin.isTTY) throw new Error(`引数が足りません。\n${USAGE}`);

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    while (!TEMPLATES[template]) {
      for (const [index, name] of TEMPLATE_NAMES.entries()) console.log(`  ${index + 1}) ${name} — ${TEMPLATES[name].description}`);
      const answer = (await rl.question("テンプレート（番号か名前）: ")).trim();
      template = TEMPLATE_NAMES[Number(answer) - 1] ?? answer;
    }
    while (!dir) dir = (await rl.question("フォルダ名: ")).trim();
    return { template, dir };
  } finally {
    rl.close();
  }
}

try {
  const args = parseCliArgs(process.argv.slice(2));
  const { template, dir } = await ask(args);
  const localDir = process.env.CREATE_STARTER_LOCAL_DIR;
  await create({
    template,
    dir,
    ref: args.ref,
    cwd: process.cwd(),
    fetchTemplate: localDir ? fromLocalDir(localDir) : fromGitHub(),
    run,
    hasCommand,
    log: console.log,
  });
} catch (error) {
  console.error(`✗ ${error.message}`);
  process.exit(1);
}
