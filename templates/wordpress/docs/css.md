# CSS の書き方（Vanilla CSS）

## レイヤー

`theme/src/assets/css/index.css` で `@layer` を次の順に宣言しています。後のレイヤーほど優先されます。

- `reset`（`base/reset.css`）: リセット。[kiso.css](https://github.com/tak-dcxi/kiso.css) をもとにした共通のファイルなので編集しない
- `theme`（`base/theme.css`）: デザイントークンとベース要素

`css/pages/` のページ別 CSS はレイヤーの外に出力されるため、どのレイヤーよりも優先されます。

## トークン

- カラー等のトークンは `theme.css` の `:root` に CSS 変数で定義し、`var(--…)` で参照する
- 新しい色は既存の命名（`--color-*`）にそろえる
- クラス名は BEM（`block__element--modifier`）。Stylelint で検査している

## Sass

必要になったら [Sass を導入する](sass.md) の手順で足せます。
