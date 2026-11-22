#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { stdin } from "node:process";

import * as p from "@clack/prompts";
import pc from "picocolors";

import { create, fromGitHub, fromLocalDir, parseCliArgs } from "./lib/create.js";
import { ask, PromptCancelled } from "./lib/prompt.js";
import { runQuietly } from "./lib/run.js";
import { formatNextSteps, USAGE } from "./lib/templates.js";

const { version } = createRequire(import.meta.url)("./package.json");

function hasCommand(command) {
  return new Promise((resolve) => {
    const child = spawn(command, ["--version"], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("exit", (code) => resolve(code === 0));
  });
}

let spin;

try {
  p.intro(`${pc.bgCyan(pc.black(" create-starter "))} ${pc.dim(`v${version}`)}`);
  const args = parseCliArgs(process.argv.slice(2));
  if (args.help) {
    p.note(USAGE, "使い方");
    p.outro("引数を省くと、対話で聞きます。");
    process.exit(0);
  }

  const { template, dir, css } = await ask({ ...args, isTTY: stdin.isTTY });
  const localDir = process.env.CREATE_STARTER_LOCAL_DIR;

  const { warnings } = await create({
    template,
    css,
    dir,
    ref: args.ref,
    cwd: process.cwd(),
    fetchTemplate: localDir ? fromLocalDir(localDir) : fromGitHub(),
    run: runQuietly,
    hasCommand,
    progress(message) {
      if (!spin) {
        spin = p.spinner();
        spin.start(message);
        return;
      }
      spin.message(message);
    },
  });

  spin?.stop(`${dir} に展開しました`);
  for (const warning of warnings) p.log.warn(warning);
  p.note(formatNextSteps(template, dir), "次のコマンド");
  p.outro("準備ができました。GitHub にはまだ何も作っていません。");
} catch (error) {
  if (error instanceof PromptCancelled) {
    p.cancel(error.message);
    process.exit(0);
  }
  if (spin) spin.error(error.message);
  else p.log.error(error.message);
  process.exit(1);
}
