// @ts-check
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sitemap from "@astrojs/sitemap";
import { defineConfig, fontProviders } from "astro/config";
import robotsTxt from "astro-robots-txt";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  integrations: [sitemap(), robotsTxt()],
  vite: {
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
  },
  fonts: [
    {
      name: "Inter",
      cssVariable: "--font-inter",
      provider: fontProviders.google(),
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      name: "Noto Sans JP",
      cssVariable: "--font-noto-sans-jp",
      provider: fontProviders.google(),
      weights: [400, 500, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "sans-serif"],
    },
  ],
});
