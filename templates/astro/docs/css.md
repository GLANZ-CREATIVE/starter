# CSS の書き方（Vanilla CSS）

## レイヤー

`src/styles/global.css` で `@layer` を次の順に宣言しています。後のレイヤーほど優先されます。

- `reset`（`src/styles/reset.css`）: リセット。[kiso.css](https://github.com/tak-dcxi/kiso.css) をもとにした共通のファイルなので編集しない
- `theme`（`src/styles/theme.css`）: デザイントークンとベース要素

コンポーネントの scoped `<style>` はレイヤーの外に出力されるため、どのレイヤーよりも優先されます。

## トークン

- カラー等のトークンは `theme.css` の `:root` に CSS 変数で定義し、`var(--…)` で参照する
- 新しい色は既存の命名（`--color-*`）にそろえる

## スタイルの置き場所

- コンポーネント固有のスタイルは、そのコンポーネントの scoped `<style>` に書く
- クラス名は BEM（`block__element--modifier`）。Stylelint で検査している

## Sass

必要になったら [Sass を使う](sass.md) の手順で足せます。
