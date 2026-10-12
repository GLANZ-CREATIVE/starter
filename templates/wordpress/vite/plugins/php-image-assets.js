import { existsSync, globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { stripPhpComments } from "./strip-php-comments.js";

const VIRTUAL_MODULE_ID = "virtual:php-images";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

const IMAGE_EXT = "jpg|jpeg|png|gif|webp|svg|avif|tiff";
const ASSETS_URL_PATTERN = new RegExp(`assets_url\\s*\\(\\s*(['"])(images\\/[^'"]+\\.(?:${IMAGE_EXT}))\\1\\s*\\)`, "gi");

/**
 * PHP の assets_url('images/...') 参照だけを Vite のビルド対象にする。
 *
 * @param {{ themeDir?: string; root?: string }} [options]
 */
export function phpImageAssets(options = {}) {
  const root = options.root ?? process.cwd();
  const themeDir = options.themeDir ?? "theme";
  const assetsRoot = resolve(root, themeDir, "src/assets");

  /** @type {string[]} */
  let cachedImagePaths = [];

  function scanPhpFiles() {
    const phpFiles = globSync(`${themeDir}/**/*.php`, { cwd: root });
    /** @type {Set<string>} */
    const imagePaths = new Set();

    for (const file of phpFiles) {
      const absolutePath = resolve(root, file);
      const content = stripPhpComments(readFileSync(absolutePath, "utf8"));
      const pattern = new RegExp(ASSETS_URL_PATTERN.source, ASSETS_URL_PATTERN.flags);

      for (const match of content.matchAll(pattern)) {
        imagePaths.add(match[2]);
      }
    }

    return [...imagePaths].sort();
  }

  function generateModule(imagePaths) {
    const imports = [];

    for (const imagePath of imagePaths) {
      const absolutePath = resolve(assetsRoot, imagePath);

      if (!existsSync(absolutePath)) {
        this.warn(`Missing image: ${imagePath} (referenced in PHP)`);
        continue;
      }

      imports.push(`import ${JSON.stringify(absolutePath)};`);
    }

    if (imports.length === 0) {
      return "// No PHP-referenced images found\n";
    }

    return `${imports.join("\n")}\n`;
  }

  return {
    name: "vite-plugin-php-image-assets",

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) {
        return;
      }

      cachedImagePaths = scanPhpFiles();
      return generateModule.call(this, cachedImagePaths);
    },

    buildStart() {
      const phpFiles = globSync(`${themeDir}/**/*.php`, { cwd: root });

      for (const file of phpFiles) {
        this.addWatchFile(resolve(root, file));
      }
    },

    handleHotUpdate({ server, file }) {
      if (!file.endsWith(".php")) {
        return;
      }

      const module = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
      if (!module) {
        return;
      }

      cachedImagePaths = scanPhpFiles();
      server.moduleGraph.invalidateModule(module);
      return [module];
    },
  };
}
