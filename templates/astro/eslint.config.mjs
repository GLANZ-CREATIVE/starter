import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import astro from "eslint-plugin-astro";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/", ".astro/", "node_modules/", "public/"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  // IDE など cwd によっては plugin 内の @typescript-eslint/parser 解決が失敗し、
  // フロントマターが JS としてパースされ interface で落ちるため明示する
  {
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".astro"],
      },
    },
  },
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [["^astro:"], ["^node:"], ["^@?\\w"], ["^@/"], ["^\\."]],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
  {
    files: ["**/*.astro"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='br']",
          message: "<br> は使わない。改行したい位置で <span> に分け、CSS で display: block（または inline-block）にする。詩など必要な箇所だけ eslint-disable で外す",
        },
        {
          selector: "JSXAttribute[name.name='style']",
          message: 'style="" は使わない。クラス経由で <style>（scoped）かグローバル CSS に書く',
        },
      ],
    },
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  prettier,
];
