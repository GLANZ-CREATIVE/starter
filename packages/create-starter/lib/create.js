import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";

import { CSS_METHOD_NAMES, CSS_METHODS, TEMPLATE_NAMES, TEMPLATES, USAGE, VARIANT_MANIFEST } from "./templates.js";

const REPO = "GLANZ-CREATIVE/starter";
const PACKAGE_NAME = /^[a-z0-9][a-z0-9._-]*$/;

export function invalidPackageNameReason(name) {
  if (!PACKAGE_NAME.test(name)) {
    return `「${name}」は package.json の name に使えません。小文字の英数字と - . _ だけにしてください。`;
  }
}

export function parseCliArgs(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: {
        ref: { type: "string", default: "main" },
        css: { type: "string" },
        help: { type: "boolean", short: "h", default: false },
      },
      allowPositionals: true,
      strict: true,
    });
  } catch (error) {
    if (error.code !== "ERR_PARSE_ARGS_UNKNOWN_OPTION") throw error;
    const option = error.message.match(/'([^']+)'/)?.[1] ?? "";
    throw new Error(`オプション「${option}」はありません。\n使い方: ${USAGE}`);
  }
  const { values, positionals } = parsed;
  const [template, dir] = positionals;
  return { template, dir, css: values.css, ref: values.ref, help: values.help };
}

async function isEmptyOrMissing(path) {
  try {
    return (await readdir(path)).length === 0;
  } catch (error) {
    if (error.code === "ENOENT") return true;
    throw error;
  }
}

export async function validate({ template, css, dir, cwd }) {
  if (!TEMPLATES[template]) {
    throw new Error(`テンプレート「${template}」はありません。選べるのは ${TEMPLATE_NAMES.join(", ")} です。`);
  }
  if (!CSS_METHODS[css]) {
    throw new Error(`CSS の方式「${css}」はありません。選べるのは ${CSS_METHOD_NAMES.join(", ")} です。`);
  }
  const reason = invalidPackageNameReason(basename(resolve(cwd, dir)));
  if (reason) throw new Error(reason);
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

// 共通部分の上に、CSS の方式ごとの差分を重ねる順に並べる
function sourceDirs(template, css) {
  const { overlay } = CSS_METHODS[css];
  return [`templates/${template}`, ...(overlay ? [`${overlay}/${template}`] : [])];
}

export function fromGitHub() {
  return async ({ template, css, ref, dest }) => {
    const { downloadTemplate } = await import("giget");
    const commit = await resolveCommit(ref);
    for (const dir of sourceDirs(template, css)) {
      await downloadTemplate(`gh:${REPO}/${dir}#${commit ?? ref}`, { dir: dest, force: true, registry: false });
    }
    return { commit };
  };
}

export function fromLocalDir(root) {
  return async ({ template, css, dest }) => {
    for (const dir of sourceDirs(template, css)) {
      await cp(join(root, dir), dest, {
        recursive: true,
        filter: (source) => !source.split(/[\\/]/).includes("node_modules"),
      });
    }
  };
}

export async function applyVariantManifest(dest) {
  const path = join(dest, VARIANT_MANIFEST);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  for (const file of manifest.remove ?? []) await rm(join(dest, file), { recursive: true, force: true });
  await rm(path);
}

async function rewritePackageNameKeepingFormat(dest, name) {
  const path = join(dest, "package.json");
  const source = await readFile(path, "utf8");
  const renamed = source.replace(/("name"\s*:\s*)"[^"]*"/, `$1${JSON.stringify(name)}`);
  if (JSON.parse(renamed).name !== name) throw new Error("package.json の name を書き換えられませんでした。");
  await writeFile(path, renamed);
}

async function postSetup({ template, css, dest, source, run, hasCommand, progress }) {
  const options = { cwd: dest };
  const warnings = [];
  await run("git", ["init", "-b", "main"], options);

  // lefthook のフックを新しいリポジトリに入れるため、install は git init のあとに行う
  progress("依存関係をインストールしています");
  if (await hasCommand("mise")) {
    await run("mise", ["trust"], options);
    await run("mise", ["install"], options);
    await run("mise", ["exec", "--", "pnpm", "install", "--frozen-lockfile"], options);
  } else {
    warnings.push("mise が見つかりません。.mise.toml の Node / pnpm の版を手で合わせてください。");
    await run("pnpm", ["install", "--frozen-lockfile"], options);
  }

  await commitPristineTemplate({ template, css, source, run, options });
  return warnings;
}

async function commitPristineTemplate({ template, css, source, run, options }) {
  const subject = `chore: @glanz-creative/starter の ${template} テンプレート（${CSS_METHODS[css].title}）から作成`;
  await run("git", ["add", "-A"], options);
  await run("git", ["commit", "--no-verify", "-m", subject, "-m", source], options);
}

export async function create({ template, css, dir, ref, cwd, fetchTemplate, run, hasCommand, progress = () => {} }) {
  await validate({ template, css, dir, cwd });
  const dest = resolve(cwd, dir);
  const name = basename(dest);

  progress("テンプレートを取得しています");
  const { commit } = (await fetchTemplate({ template, css, ref, dest })) ?? {};
  await applyVariantManifest(dest);
  await rewritePackageNameKeepingFormat(dest, name);
  const source = `参照元: ${REPO}@${ref}${commit ? ` (${commit})` : ""}`;
  const warnings = await postSetup({ template, css, dest, source, run, hasCommand, progress });
  return { warnings };
}
