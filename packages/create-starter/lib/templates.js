export const TEMPLATES = {
  wordpress: { description: "WordPress（wp-env + Vite）", nextSteps: ["Docker を起動してから pnpm start"] },
  vite: { description: "Vite の静的サイト", nextSteps: ["pnpm dev"] },
  astro: { description: "Astro の静的サイト", nextSteps: ["pnpm dev"] },
};

export const TEMPLATE_NAMES = Object.keys(TEMPLATES);
