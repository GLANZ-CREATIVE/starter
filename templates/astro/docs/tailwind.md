# Tailwind CSS を使う

Tailwind CSS v4 を公式の Vite プラグイン（`@tailwindcss/vite`）で導入します。

> 動作確認: Astro 7.3 / tailwindcss 4.3 / stylelint 17 / pnpm 12

## 1. パッケージを追加

```bash
pnpm astro add tailwind
```

`tailwindcss` と `@tailwindcss/vite` が追加され、`astro.config.mjs` の `vite.plugins` に `tailwindcss()` が登録されます。既存の `src/styles/global.css` は書き換えられません。

`astro add` が挿入した import は ESLint（simple-import-sort）と Prettier の規則に合わないので整形します。

```bash
pnpm exec eslint --fix astro.config.mjs
pnpm exec prettier --write astro.config.mjs
```

## 2. `global.css` を書き換える

先頭の `@import './kiso.css';` を次に差し替えます。

```css
/* リセットは kiso.css に任せるため、Tailwind の preflight は読み込まない */
@layer theme, base, components, utilities;

@import "tailwindcss/theme.css" layer(theme);
@import "./kiso.css" layer(base);

/* source: 既定の走査起点はプロジェクトルートで、docs/ などの Markdown に書いたクラスまで出力されるため src/ に限定する */
@import "tailwindcss/utilities.css" layer(utilities) source("../");
```

続けて、残りを次のように変えます。

- `:root { ... }` を `@theme { ... }` に書き換える
- `html { ... }` を `@layer base { ... }` で囲む

`@theme` に置いた `--color-*` と `--font-*` からは、`bg-bg`・`text-accent`・`font-sans` などのユーティリティが生成されます。変数自体も `:root` に出力されるので、既存の `var(--color-accent)` はそのまま動きます。`@layer base` で囲むのは、レイヤー外のスタイルがユーティリティより優先されるからです。囲まないと、`<html>` にユーティリティを付けても効きません。

`global.css` は `BaseLayout.astro` で読み込み済みなので、import の追加は不要です。

## 3. Stylelint を Tailwind 対応にする

`stylelint.config.mjs` に Tailwind の at-rule の構文を宣言します。宣言した at-rule は未知扱いされなくなり、引数も宣言どおりに検査されます。`@reference global;` のような誤記は引き続きエラーになります。

```js
export default {
  // （既存の extends / rules / overrides / ignoreFiles はそのまま）
  rules: {
    // （既存のルールに追加）
    // 値の構文検査は --spacing() などの Tailwind 関数を解釈できない
    "declaration-property-value-no-unknown": [true, { ignoreProperties: { "/.+/": "/--(alpha|spacing)\\(/" } }],
  },
  languageOptions: {
    syntax: {
      atRules: {
        theme: { prelude: "[ inline | static | reference | default ]*" },
        source: { prelude: "<string> | not <string> | inline( <string> )" },
        utility: { prelude: "<any-value>" },
        variant: { prelude: "<any-value>" },
        "custom-variant": { prelude: "<any-value>" },
        apply: { prelude: "<any-value>" },
        reference: { prelude: "<string>" },
      },
    },
  },
};
```

## スタイルはユーティリティで書く

```astro
<h1 class="text-accent md:text-4xl">Astro</h1>
```

scoped `<style>` は、複雑な `@keyframes` アニメーションなどユーティリティで書きにくいものに限ります。`@apply` は使わず、テーマの値は `var(--color-accent)` のように CSS 変数で参照します。

導入後は `.claude/rules/styling.md` も、トークンの定義先を `@theme` に、スタイルはユーティリティ基本に書き換えます。
