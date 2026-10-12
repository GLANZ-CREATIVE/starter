import { promises as fs } from "node:fs";
import path from "node:path";

import sharp from "sharp";

const CONVERTIBLE = /\.(png|jpe?g|tiff)$/i;

/**
 * ビルド書き出し後に PNG / JPEG / TIFF を WebP に変換する。
 * ソース参照（assets_url('images/foo.png')）はそのままで、manifest の出力だけ .webp になる。
 * Vite 8（Rolldown）では generateBundle の bundle 書き換えが使えないため writeBundle で処理する。
 *
 * @param {{ quality?: number }} [options]
 */
export function convertToWebp(options = {}) {
  const quality = options.quality ?? 80;

  return {
    name: "vite-plugin-convert-to-webp",
    apply: "build",
    enforce: "post",
    async writeBundle(outputOptions, bundle) {
      const dir = outputOptions.dir;
      if (!dir) {
        return;
      }

      /** @type {Map<string, string>} */
      const converted = new Map();

      for (const [fileName, asset] of Object.entries(bundle)) {
        if (asset.type !== "asset" || !CONVERTIBLE.test(fileName)) {
          continue;
        }

        const inputPath = path.join(dir, fileName);
        const webpFileName = fileName.replace(CONVERTIBLE, ".webp");
        const outputPath = path.join(dir, webpFileName);

        await sharp(inputPath).webp({ quality }).toFile(outputPath);

        const [before, after] = await Promise.all([
          fs.stat(inputPath),
          fs.stat(outputPath),
        ]);
        const ratio = (((before.size - after.size) / before.size) * 100).toFixed(0);
        console.log(
          `✨ [convert-to-webp] ${fileName} → ${webpFileName}  -${ratio}%  ${(before.size / 1024).toFixed(2)} kB ⭢  ${(after.size / 1024).toFixed(2)} kB`,
        );

        await fs.unlink(inputPath);
        converted.set(fileName, webpFileName);
      }

      if (converted.size === 0) {
        return;
      }

      /** @param {string} content */
      function replaceConvertedReferences(content) {
        let next = content;

        for (const [from, to] of converted) {
          next = next.replaceAll(from, to);

          const fromBase = path.basename(from);
          const toBase = path.basename(to);
          const basePattern = new RegExp(
            fromBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "g",
          );
          next = next.replace(basePattern, toBase);
        }

        return next;
      }

      for (const fileName of Object.keys(bundle)) {
        if (!/\.(js|css|html)$/.test(fileName)) {
          continue;
        }

        const filePath = path.join(dir, fileName);
        const content = await fs.readFile(filePath, "utf8");
        const next = replaceConvertedReferences(content);

        if (next !== content) {
          await fs.writeFile(filePath, next);
        }
      }

      const manifestPath = path.join(dir, ".vite/manifest.json");
      let raw;
      try {
        raw = await fs.readFile(manifestPath, "utf8");
      } catch {
        return;
      }

      const manifest = JSON.parse(raw);
      let changed = false;

      for (const entry of Object.values(manifest)) {
        if (entry.file && converted.has(entry.file)) {
          entry.file = converted.get(entry.file);
          changed = true;
        }

        if (Array.isArray(entry.assets)) {
          const nextAssets = entry.assets.map((asset) =>
            converted.has(asset) ? converted.get(asset) : asset,
          );
          if (nextAssets.some((asset, i) => asset !== entry.assets[i])) {
            entry.assets = nextAssets;
            changed = true;
          }
        }
      }

      if (changed) {
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      }
    },
  };
}
