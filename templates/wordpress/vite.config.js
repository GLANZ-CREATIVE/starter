import { globSync } from "node:fs";
import { basename, resolve } from "node:path";

import browserslist from "browserslist";
import { browserslistToTargets } from "lightningcss";
import { defineConfig } from "vite";
import FullReload from "vite-plugin-full-reload";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

import { convertToWebp } from "./vite/plugins/convert-to-webp.js";
import { phpImageAssets } from "./vite/plugins/php-image-assets.js";

const lightningcssTargets = browserslistToTargets(browserslist());

// プロジェクトルート。ESM では __dirname が無いため import.meta.dirname を使う
const rootDir = import.meta.dirname;

// pages/*.css を自動でエントリ化する（CSS を追加するだけでビルド対象になる）
const pageStyleEntries = Object.fromEntries(
  globSync("theme/src/assets/css/pages/*.css").map((file) => [
    basename(file, ".css"),
    resolve(rootDir, file),
  ]),
);

export default defineConfig({
  root: "theme/src",
  base: process.env.NODE_ENV === "production" ? "./" : "/",
  server: {
    host: "0.0.0.0",
    port: 3000,
    // 8888 の WordPress ページに注入される CSS の url() を 3000 向けに解決する
    origin: "http://localhost:3000",
    strictPort: true,
    cors: true,
    hmr: {
      host: "localhost",
      protocol: "ws",
      clientPort: 3000,
    },
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
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
    outDir: resolve(rootDir, "theme/dist"),
    emptyOutDir: true,
    manifest: true,
    cssMinify: "lightningcss",
    // SVGファイルを個別ファイルとして出力するため、インライン化の閾値を0に設定
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(rootDir, "theme/src/assets/js/main.js"),
        style: resolve(rootDir, "theme/src/assets/css/index.css"),
        ...pageStyleEntries,
      },
    },
  },
  plugins: [
    FullReload(["theme/**/*.php"], { root: rootDir }),
    phpImageAssets({ root: rootDir }),
    convertToWebp({ quality: 80 }),
    ViteImageOptimizer({
      test: /\.(gif|webp|svg|avif)$/i,
      includePublic: true,
      logStats: true,
      ansiColors: true,
      svg: {
        multipass: true,
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                cleanupNumericValues: false,
                removeViewBox: false,
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
      webp: {
        quality: 80,
        lossless: false,
      },
    }),
  ],
});
