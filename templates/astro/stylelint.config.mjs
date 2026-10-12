/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-standard", "stylelint-config-recess-order"],
  rules: {
    // BEM命名（block__element--modifier）を許容
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
      { message: (selector) => `"${selector}" はBEM命名規則に従ってください` },
    ],
    // Tailwind は url() 記法の @import を処理せず、stylelint-config-standard-scss も文字列記法を求めるため、拡張時に書き換えずに済むよう揃える
    "import-notation": "string",
  },
  overrides: [
    {
      files: ["**/*.astro"],
      customSyntax: "postcss-html",
    },
  ],
  ignoreFiles: ["dist/**", ".astro/**", "node_modules/**", "src/styles/kiso.css"],
};
