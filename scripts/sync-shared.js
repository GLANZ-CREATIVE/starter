import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

import { CSS_METHODS, TEMPLATE_NAMES as TEMPLATES, VARIANT_MANIFEST } from "../packages/create-starter/lib/templates.js";

export const GITIGNORE_MARKER = "# ---- template specific ----";

const RESET_CSS_PATHS = {
  wordpress: "theme/src/assets/css/base/reset.css",
  vite: "src/assets/css/base/reset.css",
  astro: "src/styles/reset.css",
  webapp: "apps/web/src/styles/reset.css",
};

// 差分を持つ CSS の方式。どれも Tailwind の preflight のようにリセットを自前で持つので、reset.css は配らない
const VARIANTS = Object.entries(CSS_METHODS).flatMap(([name, { overlay }]) => (overlay ? [{ name, overlay }] : []));

// 共通部分の版の更新を差分で取りこぼさないよう、差分に置くなら extends で検査させるファイル
const MUST_EXTEND = new Set(["package.json", "pnpm-workspace.yaml"]);

export function resetCssTargets(templates, paths) {
  const undecided = templates.filter((t) => !(t in paths));
  if (undecided.length > 0) throw new Error(`RESET_CSS_PATHS に ${undecided.join(", ")} の配り先（不要なら null）を書いてください`);
  return templates.filter((t) => paths[t]).map((t) => `templates/${t}/${paths[t]}`);
}

const TARGETS = {
  ".editorconfig": TEMPLATES.map((t) => `templates/${t}/.editorconfig`),
  ".gitattributes": TEMPLATES.map((t) => `templates/${t}/.gitattributes`),
  ".mise.toml": [".mise.toml", ...TEMPLATES.map((t) => `templates/${t}/.mise.toml`)],
  "css/reset.css": resetCssTargets(TEMPLATES, RESET_CSS_PATHS),
};

const FORMAT = { lineWidth: 150, quote: "double", trailingCommas: "all" };

const FORMAT_LABELS = { lineWidth: "行幅", quote: "引用符", trailingCommas: "末尾カンマ" };

const fromBiome = (config) => ({
  lineWidth: config.formatter?.lineWidth ?? 80,
  quote: config.javascript?.formatter?.quoteStyle ?? "double",
  trailingCommas: config.javascript?.formatter?.trailingCommas ?? "all",
});

const fromPrettier = (config) => ({
  lineWidth: config.printWidth ?? 80,
  quote: config.singleQuote ? "single" : "double",
  trailingCommas: config.trailingComma ?? "all",
});

const fromOxfmt = ({ fmt = {} }) => ({
  lineWidth: fmt.printWidth ?? 100,
  quote: fmt.singleQuote ? "single" : "double",
  trailingCommas: fmt.trailingComma ?? "all",
});

const FORMATTER_CONFIGS = {
  wordpress: { file: ".prettierrc.json", read: fromPrettier },
  vite: { file: "biome.json", read: fromBiome },
  astro: { file: ".prettierrc.mjs", read: fromPrettier },
  webapp: { file: "vite.config.ts", read: fromOxfmt },
};

const GIT_HOOKS = { wordpress: "lefthook", vite: "lefthook", astro: "lefthook", webapp: "vite-plus" };

const VITE_PLUS_WITHOUT_INSTALL = "data:text/javascript,export const defineConfig = (config) => config;";

registerHooks({
  resolve: (specifier, context, nextResolve) =>
    specifier === "vite-plus" ? { url: VITE_PLUS_WITHOUT_INSTALL, shortCircuit: true } : nextResolve(specifier, context),
});

async function loadConfig(path) {
  if (path.endsWith(".json")) return JSON.parse(await readFile(path, "utf8"));
  return (await import(`${pathToFileURL(path).href}?t=${Date.now()}`)).default;
}

const withoutCorepackHash =(packageManager) => packageManager?.split("+")[0];

export function renderGitignore(base, current) {
  const lines = current.split("\n");
  const markerIndex = lines.indexOf(GITIGNORE_MARKER);
  const specific = markerIndex === -1 ? current : lines.slice(markerIndex + 1).join("\n");
  return `${base.trimEnd()}\n\n${GITIGNORE_MARKER}\n${specific.trimStart()}`;
}

async function readOptional(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

async function expectedFiles(root) {
  const files = [];
  for (const [source, targets] of Object.entries(TARGETS)) {
    const content = await readFile(join(root, "shared", source), "utf8");
    for (const target of targets) files.push({ source: `shared/${source}`, target, content });
  }
  const base = await readFile(join(root, "shared/gitignore.base"), "utf8");
  for (const t of TEMPLATES) {
    const target = `templates/${t}/.gitignore`;
    const current = (await readOptional(join(root, target))) ?? "";
    files.push({ source: "shared/gitignore.base", target, content: renderGitignore(base, current) });
  }
  return files;
}

export async function sync(root) {
  for (const { target, content } of await expectedFiles(root)) {
    const path = join(root, target);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
}

function parseMiseTools(toml) {
  return Object.fromEntries([...toml.matchAll(/^(\w+)\s*=\s*"([^"]+)"/gm)].map(([, name, version]) => [name, version]));
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function checkLefthook(root, t) {
  const problems = [];
  const config = await readOptional(join(root, `templates/${t}/lefthook.yml`));
  if (config === undefined) problems.push(`templates/${t}/lefthook.yml がない`);
  else if (/^\s+commands:/m.test(config)) problems.push(`templates/${t}/lefthook.yml が commands: を使っている（jobs: に統一する）`);
  else if (!/^\s+stage_fixed:\s*true/m.test(config)) {
    problems.push(`templates/${t}/lefthook.yml の pre-commit に stage_fixed: true がない（整形結果をコミットに含める）`);
  }
  if (await exists(join(root, `templates/${t}/.lefthook.yml`))) problems.push(`templates/${t}/.lefthook.yml は lefthook.yml に改名する`);
  return problems;
}

// vp staged は lint-staged なので、整形で変わったファイルはそのままコミットに含まれる
async function checkVitePlusHooks(root, t, config) {
  const problems = [];
  const path = `templates/${t}/.vite-hooks/pre-commit`;
  const hook = await readOptional(join(root, path));
  if (hook === undefined) problems.push(`${path} がない`);
  else if (!/^\s*vp staged\b/m.test(hook)) problems.push(`${path} が vp staged を実行しない（整形結果をコミットに含める）`);
  const stagedCommands = Object.values(config?.staged ?? {}).flat();
  if (config && !stagedCommands.some((command) => /\bvp check --fix\b/.test(command))) {
    problems.push(`templates/${t}/vite.config.ts の staged が vp check --fix を実行しない（整形結果をコミットに含める）`);
  }
  return problems;
}

async function loadFormatterConfig(root, t) {
  const { file } = FORMATTER_CONFIGS[t];
  try {
    return { config: await loadConfig(join(root, `templates/${t}`, file)) };
  } catch (error) {
    if (error.code !== "ERR_MODULE_NOT_FOUND" || file !== "vite.config.ts") throw error;
    return {
      problem: `templates/${t}/${file} を読み込めない（ルートの vite.config.ts は vite-plus 以外を import しない。Vite のプラグインは apps/web/vite.config.ts に書く）`,
    };
  }
}

// pnpm-workspace.yaml の overrides の「キー: 値」を返す
function parseOverrides(yaml) {
  const lines = yaml.split("\n");
  const start = lines.findIndex((line) => /^overrides:\s*$/.test(line));
  if (start === -1) return [];
  const overrides = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break;
    const match = line.match(/^\s+("[^"]+"|'[^']+'|[^\s:#][^:]*):\s*(.+?)\s*$/);
    if (match) overrides.push({ key: match[1].replace(/^["']|["']$/g, ""), value: match[2].replace(/^["']|["']$/g, "") });
  }
  return overrides;
}

async function checkOverrideBounds(root, t) {
  const path = `templates/${t}/pnpm-workspace.yaml`;
  const yaml = await readOptional(join(root, path));
  if (yaml === undefined) return [];
  return parseOverrides(yaml)
    .filter(({ value }) => value.includes(">") && !value.includes("<"))
    .map(({ key, value }) => `${path} の overrides の ${key}: "${value}" に上限（<N）がない（メジャー版を黙って越える）`);
}

async function listFiles(dir) {
  try {
    const entries = await readdir(dir, { recursive: true, withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => relative(dir, join(entry.parentPath, entry.name)).replaceAll("\\", "/"));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function listDirs(dir) {
  try {
    return (await readdir(dir, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

const normalizeLine = (line) => line.trim().replace(/,$/, "");

// base の空行以外の行が、同じ順で current に含まれていなければ、最初に見つからない行を返す
function firstMissingLine(base, current) {
  const lines = current.split("\n").map(normalizeLine);
  let index = 0;
  for (const line of base.split("\n").map(normalizeLine)) {
    if (line === "") continue;
    const found = lines.indexOf(line, index);
    if (found === -1) return line;
    index = found + 1;
  }
}

async function checkVariant(root, variant, t, sharedTargets) {
  const problems = [];
  const dir = `${variant.overlay}/${t}`;
  const raw = await readOptional(join(root, dir, VARIANT_MANIFEST));
  if (raw === undefined) return [`${dir}/${VARIANT_MANIFEST} がない`];
  const { remove = [], extends: extended = [] } = JSON.parse(raw);

  for (const file of remove) {
    if (!(await exists(join(root, `templates/${t}`, file)))) problems.push(`${dir}/${VARIANT_MANIFEST} の remove にある ${file} が templates/${t} にない`);
  }
  const reset = RESET_CSS_PATHS[t];
  if (reset && !remove.includes(reset)) {
    problems.push(`${dir}/${VARIANT_MANIFEST} の remove に ${reset} がない（${variant.name} では reset.css を配らない）`);
  }

  const files = await listFiles(join(root, dir));
  for (const file of files) {
    if (sharedTargets.has(`templates/${t}/${file}`)) problems.push(`${dir}/${file} は shared/ から配るファイルなので差分に置かない`);
    const name = file.split("/").at(-1);
    if (MUST_EXTEND.has(name) && !extended.includes(file)) {
      problems.push(`${dir}/${VARIANT_MANIFEST} の extends に ${file} がない（共通部分の変更を取り込めているか検査できない）`);
    }
  }

  for (const file of extended) {
    const base = await readOptional(join(root, `templates/${t}`, file));
    const current = await readOptional(join(root, dir, file));
    if (base === undefined || current === undefined) {
      problems.push(`${dir}/${VARIANT_MANIFEST} の extends にある ${file} が templates/${t} か ${dir} にない`);
      continue;
    }
    const missing = firstMissingLine(base, current);
    if (missing !== undefined) problems.push(`${dir}/${file} に templates/${t}/${file} の「${missing}」が入っていない`);
  }

  if ((await exists(join(root, `templates/${t}/pnpm-lock.yaml`))) && !files.includes("pnpm-lock.yaml")) {
    problems.push(`${dir}/pnpm-lock.yaml がない（pnpm lock:variants で作る）`);
  }
  return problems;
}

async function checkVariants(root, sharedTargets) {
  const problems = [];
  for (const variant of VARIANTS) {
    for (const t of TEMPLATES) problems.push(...(await checkVariant(root, variant, t, sharedTargets)));
    for (const name of await listDirs(join(root, variant.overlay))) {
      if (!TEMPLATES.includes(name)) problems.push(`${variant.overlay}/${name} が create-starter の TEMPLATES にない`);
    }
  }
  return problems;
}

export async function check(root) {
  const problems = [];

  const expected = await expectedFiles(root);
  for (const { source, target, content } of expected) {
    if ((await readOptional(join(root, target))) !== content) problems.push(`${target} が ${source} と一致しない`);
  }

  const tools = parseMiseTools(await readFile(join(root, "shared/.mise.toml"), "utf8"));
  const packageManager = `pnpm@${tools.pnpm}`;
  const engine = `>=${tools.node.split(".")[0]}`;
  const lefthookVersions = {};

  for (const t of TEMPLATES) {
    const pkgPath = `templates/${t}/package.json`;
    const pkg = JSON.parse(await readFile(join(root, pkgPath), "utf8"));
    if (withoutCorepackHash(pkg.packageManager) !== packageManager) {
      problems.push(`${pkgPath} の packageManager が ${packageManager} ではない（${pkg.packageManager}）`);
    }
    if (pkg.engines?.node !== engine) {
      problems.push(`${pkgPath} の engines.node が ${engine} ではない（${pkg.engines?.node}）`);
    }
    if (GIT_HOOKS[t] === "lefthook") lefthookVersions[t] = pkg.devDependencies?.lefthook;
  }

  if (new Set(Object.values(lefthookVersions)).size > 1) {
    const list = Object.entries(lefthookVersions)
      .map(([t, v]) => `${t}: ${v}`)
      .join(", ");
    problems.push(`lefthook の版がテンプレート間でそろっていない（${list}）`);
  }

  const formatterConfigs = {};
  for (const t of TEMPLATES) {
    const { config, problem } = await loadFormatterConfig(root, t);
    if (problem) problems.push(problem);
    formatterConfigs[t] = config;
  }

  for (const t of TEMPLATES) {
    problems.push(...(await (GIT_HOOKS[t] === "lefthook" ? checkLefthook(root, t) : checkVitePlusHooks(root, t, formatterConfigs[t]))));
  }

  for (const t of TEMPLATES) {
    if (!formatterConfigs[t]) continue;
    const { file, read } = FORMATTER_CONFIGS[t];
    const actual = read(formatterConfigs[t]);
    for (const [key, expected] of Object.entries(FORMAT)) {
      if (actual[key] !== expected) problems.push(`templates/${t}/${file} の${FORMAT_LABELS[key]}が ${expected} ではない（${actual[key]}）`);
    }
  }

  for (const entry of await readdir(join(root, "templates"), { withFileTypes: true })) {
    if (entry.isDirectory() && !TEMPLATES.includes(entry.name)) problems.push(`templates/${entry.name} が create-starter の TEMPLATES にない`);
  }

  const workspace = await readFile(join(root, "pnpm-workspace.yaml"), "utf8");
  if (/^\s*-\s*["']?(\.\/)?templates\b/m.test(workspace)) {
    problems.push("pnpm-workspace.yaml に templates/ を入れない（各テンプレートは自分の lockfile を持つ単体のプロジェクト）");
  }

  for (const t of TEMPLATES) problems.push(...(await checkOverrideBounds(root, t)));

  problems.push(...(await checkVariants(root, new Set(expected.map(({ target }) => target)))));

  return problems;
}

if (import.meta.main) {
  const root = join(import.meta.dirname, "..");
  if (process.argv.includes("--check")) {
    const problems = await check(root);
    for (const problem of problems) console.error(`✗ ${problem}`);
    if (problems.length > 0) {
      console.error("\n`pnpm sync:shared` で配り直すか、テンプレートや差分（variants/）のファイルを直してください。");
      process.exit(1);
    }
    console.log("✓ shared/ とテンプレートはそろっています");
  } else {
    await sync(root);
    console.log("✓ shared/ をテンプレートへ配りました");
  }
}
