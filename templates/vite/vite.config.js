import browserslist from "browserslist";
import fs from "fs";
import { browserslistToTargets } from "lightningcss";
import path, { resolve } from "path";
import { defineConfig } from "vite";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import Sitemap from "vite-plugin-sitemap";

const lightningcssTargets = browserslistToTargets(browserslist());

function getHtmlInputsFromAllDirs(rootDir) {
  const inputs = {};

  if (!fs.existsSync(rootDir)) {
    return inputs;
  }

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    const excludeDirs = new Set(["node_modules", ".git", "dist", "public"]);

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (excludeDirs.has(entry.name)) continue;
        if (entry.name.startsWith(".")) continue;
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        const name = path
          .relative(rootDir, fullPath)
          .replace(/\\/g, "/")
          .replace(/\.html$/, "");
        inputs[name] = fullPath;
      }
    }
  }

  walk(rootDir);
  return inputs;
}

const DEFAULT_OPTIONS = {
  logStats: true,
  ansiColors: true,
  test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
  exclude: undefined,
  include: undefined,
  includePublic: true,
  svg: {
    multipass: true,
    plugins: [
      {
        name: "preset-default",
        params: {
          overrides: {
            cleanupNumericValues: false,
            cleanupIds: {
              minify: false,
              remove: false,
            },
            convertPathData: false,
          },
        },
      },
      "sortAttrs",
      {
        name: "addAttributesToSVGElement",
        params: {
          attributes: [{ xmlns: "http://www.w3.org/2000/svg" }],
        },
      },
    ],
  },
  png: {
    // https://sharp.pixelplumbing.com/api-output#png
    quality: 80,
  },
  jpeg: {
    // https://sharp.pixelplumbing.com/api-output#jpeg
    quality: 80,
  },
  jpg: {
    // https://sharp.pixelplumbing.com/api-output#jpeg
    quality: 80,
  },
  tiff: {
    // https://sharp.pixelplumbing.com/api-output#tiff
    quality: 80,
  },
  // gif does not support lossless compression
  // https://sharp.pixelplumbing.com/api-output#gif
  gif: {},
  webp: {
    // https://sharp.pixelplumbing.com/api-output#webp
    lossless: true,
  },
  avif: {
    // https://sharp.pixelplumbing.com/api-output#avif
    lossless: true,
  },
  cache: false,
  cacheLocation: undefined,
};

const srcDir = resolve(process.cwd(), "src");
const htmlInputs = getHtmlInputsFromAllDirs(srcDir);

const dynamicRoutes = Object.keys(htmlInputs)
  .filter((name) => name !== "index")
  .map((name) => `/${name}/`);

export default defineConfig({
  base: "./",
  root: "./src",
  plugins: [
    ViteImageOptimizer({
      ...DEFAULT_OPTIONS,
    }),
    Sitemap({
      hostname: "https://example.com",
      dynamicRoutes,
      changefreq: "weekly",
      priority: 0.8,
      lastmod: new Date(),
      robots: [
        {
          userAgent: "*",
          allow: "/",
        },
      ],
    }),
  ],
  css: {
    transformer: "lightningcss",
    lightningcss: {
      targets: lightningcssTargets,
      drafts: {
        customMedia: true,
      },
    },
  },
  build: {
    outDir: resolve(process.cwd(), "dist"),
    emptyOutDir: true,
    cssMinify: "lightningcss",
    rolldownOptions: {
      input: htmlInputs,
    },
  },
  server: {
    open: "/index.html",
  },
});
