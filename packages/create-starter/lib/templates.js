export const TEMPLATES = {
  wordpress: { commands: ["pnpm start"], footnote: "Docker を起動してから実行してください。" },
  vite: { commands: ["pnpm dev"] },
  astro: { commands: ["pnpm dev"] },
};

export const TEMPLATE_NAMES = Object.keys(TEMPLATES);

export function formatNextSteps(template, dir) {
  const { commands, footnote } = TEMPLATES[template];
  const lines = [`cd ${dir}`, ...commands];
  if (footnote) lines.push("", footnote);
  return lines.join("\n");
}
