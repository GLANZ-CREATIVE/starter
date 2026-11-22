import { defineConfig } from "cf/config";

import * as entrypoint from "../api/src/index.ts" with { type: "cf-worker" };

export default defineConfig({
  worker: {
    // create-starter が案件名に置き換える
    name: "webapp-starter",
    compatibilityDate: "2026-11-17",
    entrypoint,
    assets: {
      notFoundHandling: "single-page-application",
      // ブラウザで /api を直接開いたときも index.html ではなく api に届ける
      runWorkerFirst: ["/api/*"],
    },
  },
});
