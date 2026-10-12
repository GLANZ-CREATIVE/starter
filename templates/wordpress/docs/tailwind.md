# Tailwind CSS を導入する

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

`vite.config.js` の先頭でプラグインを import し、既存の `plugins` 配列の先頭に `tailwindcss()` を足します。配列ごと置き換えると、PHP の自動リロードや画像の変換が外れます。

```js
import tailwindcss from "@tailwindcss/vite";

plugins: [
  tailwindcss(),
  FullReload(/* 既存の引数 */),
  // phpImageAssets / convertToWebp / ViteImageOptimizer も残す
],
```

`theme/src/assets/css/index.css`:

```css
@import "tailwindcss";
@source "../../.."; /* theme/ 配下の PHP / JS をスキャン */
```

`.stylelintrc.json` の `at-rule-no-unknown` は `import` と `layer` だけを許しています。`@source` などを足したままだと `pnpm lint` が落ちるので、`ignoreAtRules` に Tailwind の at-rule を追加します。

```json
"at-rule-no-unknown": [
  true,
  {
    "ignoreAtRules": [
      "import",
      "layer",
      "theme",
      "source",
      "utility",
      "variant",
      "custom-variant",
      "apply",
      "reference"
    ]
  }
]
```

最後に `pnpm dev` で Vite を再起動します（`pnpm add` 後は必須）。
