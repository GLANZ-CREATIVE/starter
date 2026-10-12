# Sass を導入する

Vite は `sass` を入れるだけで `.scss` を扱えます。

```bash
pnpm add -D sass
```

入れた後は `pnpm dev` で Vite を再起動します（`pnpm add` 後は必須）。

## 部分ファイル（`_*.scss`）の運用

変数や mixin は `_` 始まりの部分ファイルに置き、SCSS 同士で `@use` / `@forward` します。CSS からの `@import` は、Sass をコンパイルしたあとの CSS を取り込むだけです。`$primary` のような変数は CSS 側へ残りません。

```scss
/* theme/src/assets/css/base/_variables.scss */
$primary: #1a73e8;
```

```scss
/* theme/src/assets/css/components/_button.scss */
@use "../base/variables" as *;

.button {
  color: $primary;
}
```

コンパイル結果を既存のエントリへ載せるときは、CSS を出力する SCSS を `@import` します。

```css
/* theme/src/assets/css/index.css */
@import url("./components/button.scss") layer(theme);
```

このリポジトリは `@layer`（reset / theme）で重なり順を管理しています。読み込む位置のレイヤーを意識してください。

ページ別のスタイルも同様です。変数を使うページは `css/pages/` のファイルを `.scss` にして `@use` します。CSS のままにする場合は、CSS を出力する部分ファイルだけを `@import` します。

## エントリ自体を `.scss` にしたい場合

`css/pages/` 直下の `.scss` は自動エントリの対象外（`*.css` のみ）のため、`vite.config.js` の glob を広げます。

```js
// pages/*.css を自動でエントリ化する（CSS を追加するだけでビルド対象になる）
const pageStyleEntries = Object.fromEntries(
  globSync("theme/src/assets/css/pages/*.{css,scss}").map((file) => [
    basename(file).replace(/\.(css|scss)$/, ""),
    resolve(rootDir, file),
  ]),
);
```

`style` エントリ（`theme/src/assets/css/index.css`）を `.scss` に変える場合は、同ファイル内の `style:` のパスも合わせて書き換えます。PHP 側の `vite_enqueue_page_style()` の呼び出しは、エントリ名（拡張子なし）が変わらなければそのまま使えます。

## リントの注意

stylelint の対象は `theme/src/**/*.css` のみなので、`.scss` はチェックされません（`pnpm lint` は壊れません）。SCSS も検査したい場合は `stylelint-config-standard-scss` などの導入が必要です。
