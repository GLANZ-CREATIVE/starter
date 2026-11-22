export const TEMPLATES = {
  wordpress: { commands: ["pnpm start"], footnote: "Docker を起動してから実行してください。" },
  vite: { commands: ["pnpm dev"] },
  astro: { commands: ["pnpm dev"] },
  webapp: { commands: ["pnpm dev"] },
};

export const TEMPLATE_NAMES = Object.keys(TEMPLATES);

// overlay: templates/<名前>/ に重ねる差分の置き場。null なら templates/<名前>/ をそのまま使う
export const CSS_METHODS = {
  vanilla: { title: "Vanilla CSS", overlay: null },
  tailwind: { title: "Tailwind CSS", overlay: "variants/tailwind" },
};

export const CSS_METHOD_NAMES = Object.keys(CSS_METHODS);

// 差分のフォルダに置く指示書。remove は共通部分から消すファイル、extends は共通部分の行をすべて含むべきファイル
export const VARIANT_MANIFEST = ".variant.json";

export function formatNextSteps(template, dir) {
  const { commands, footnote } = TEMPLATES[template];
  const lines = [`cd ${dir}`, ...commands];
  if (footnote) lines.push("", footnote);
  return lines.join("\n");
}
