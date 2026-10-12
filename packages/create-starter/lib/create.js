import { cp, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";

import { TEMPLATE_NAMES, TEMPLATES } from "./templates.js";

const REPO = "GLANZ-CREATIVE/starter";
const PACKAGE_NAME = /^[a-z0-9][a-z0-9._-]*$/;

export function parseCliArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    options: { ref: { type: "string", default: "main" } },
    allowPositionals: true,
    strict: true,
  });
  const [template, dir] = positionals;
  return { template, dir, ref: values.ref };
}

async function isEmptyOrMissing(path) {
  try {
    return (await readdir(path)).length === 0;
  } catch (error) {
    if (error.code === "ENOENT") return true;
    throw error;
  }
}

export async function validate({ template, dir, cwd }) {
  if (!TEMPLATES[template]) {
    throw new Error(`テンプレート「${template}」はありません。選べるのは ${TEMPLATE_NAMES.join(", ")} です。`);
  }
  const name = basename(resolve(cwd, dir));
  if (!PACKAGE_NAME.test(name)) {
    throw new Error(`フォルダ名「${name}」は package.json の name に使えません。小文字の英数字と - . _ だけにしてください。`);
  }
  if (!(await isEmptyOrMissing(resolve(cwd, dir)))) {
    throw new Error(`フォルダ「${dir}」は空ではありません。別の名前にするか、中身を移してください。`);
  }
}

// 参照元の記録は付随情報なので、取れなくても展開は止めない
async function resolveCommit(ref) {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPO}/commits/${encodeURIComponent(ref)}`, {
      headers: { Accept: "application/vnd.github.sha" },
      signal: AbortSignal.timeout(5000),
    });
    const sha = (await response.text()).trim();
    return response.ok && /^[0-9a-f]{40}$/.test(sha) ? sha : undefined;
  } catch {
    return undefined;
  }
}

export function fromGitHub() {
  return async ({ template, ref, dest }) => {
    const { downloadTemplate } = await import("giget");
    const commit = await resolveCommit(ref);
    await downloadTemplate(`gh:${REPO}/templates/${template}#${commit ?? ref}`, { dir: dest, force: true, registry: false });
    return { commit };
  };
}

export function fromLocalDir(root) {
  return async ({ template, dest }) => {
    await cp(join(root, "templates", template), dest, {
      recursive: true,
      filter: (source) => !source.split(/[\\/]/).includes("node_modules"),
    });
  };
}

async function rewritePackageNameKeepingFormat(dest, name) {
  const path = join(dest, "package.json");
  const source = await readFile(path, "utf8");
  const renamed = source.replace(/("name"\s*:\s*)"[^"]*"/, `$1${JSON.stringify(name)}`);
  if (JSON.parse(renamed).name !== name) throw new Error("package.json の name を書き換えられませんでした。");
  await writeFile(path, renamed);
}

async function postSetup({ template, dest, source, run, hasCommand, log }) {
  const options = { cwd: dest };
  await run("git", ["init", "-b", "main"], options);

  // lefthook のフックを新しいリポジトリに入れるため、install は git init のあとに行う
  if (await hasCommand("mise")) {
    await run("mise", ["trust"], options);
    await run("mise", ["install"], options);
    await run("mise", ["exec", "--", "pnpm", "install", "--frozen-lockfile"], options);
  } else {
    log("⚠ mise が見つかりません。.mise.toml の Node / pnpm の版を手で合わせてください。");
    await run("pnpm", ["install", "--frozen-lockfile"], options);
  }

  await commitPristineTemplate({ template, source, run, options });
}

async function commitPristineTemplate({ template, source, run, options }) {
  await run("git", ["add", "-A"], options);
  await run("git", ["commit", "--no-verify", "-m", `chore: @glanz-creative/starter の ${template} テンプレートから作成`, "-m", source], options);
}

export async function create({ template, dir, ref, cwd, fetchTemplate, run, hasCommand, log }) {
  await validate({ template, dir, cwd });
  const dest = resolve(cwd, dir);
  const name = basename(dest);

  log(`${template} テンプレート（${ref}）を ${dir} に展開します…`);
  const { commit } = (await fetchTemplate({ template, ref, dest })) ?? {};
  await rewritePackageNameKeepingFormat(dest, name);
  const source = `参照元: ${REPO}@${ref}${commit ? ` (${commit})` : ""}`;
  await postSetup({ template, dest, source, run, hasCommand, log });

  log("");
  log(`✓ ${dir} を作成しました。GitHub にはまだ何も作っていません。`);
  log("");
  log("次の手順:");
  log(`  cd ${dir}`);
  for (const step of TEMPLATES[template].nextSteps) log(`  ${step}`);
}
