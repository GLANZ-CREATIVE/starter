// 差分を重ねた内容を一時フォルダに組み立て、その lockfile を差分のフォルダへ書き戻す
import { execFileSync } from "node:child_process";
import { copyFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { applyVariantManifest, fromLocalDir } from "../packages/create-starter/lib/create.js";
import { CSS_METHODS, TEMPLATE_NAMES } from "../packages/create-starter/lib/templates.js";

const root = join(import.meta.dirname, "..");
const only = process.argv.slice(2);
const templates = only.length > 0 ? only : TEMPLATE_NAMES;

for (const name of templates) {
  if (!TEMPLATE_NAMES.includes(name)) throw new Error(`テンプレート「${name}」はありません。選べるのは ${TEMPLATE_NAMES.join(", ")} です。`);
}

for (const [css, { overlay }] of Object.entries(CSS_METHODS)) {
  if (!overlay) continue;
  for (const template of templates) {
    const dest = await mkdtemp(join(tmpdir(), `starter-${css}-${template}-`));
    try {
      await fromLocalDir(root)({ template, css, dest });
      await applyVariantManifest(dest);
      console.log(`→ ${overlay}/${template}`);
      execFileSync("pnpm", ["install", "--lockfile-only"], { cwd: dest, stdio: "inherit" });
      await copyFile(join(dest, "pnpm-lock.yaml"), join(root, overlay, template, "pnpm-lock.yaml"));
    } finally {
      await rm(dest, { recursive: true, force: true });
    }
  }
}
