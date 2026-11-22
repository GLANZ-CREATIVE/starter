# CSS の書き方（Vanilla CSS）

## レイヤー

`src/assets/css/index.css` で `@layer` を次の順に宣言しています。後のレイヤーほど優先されます。

- `reset`（`base/reset.css`）: リセット。[kiso.css](https://github.com/tak-dcxi/kiso.css) をもとにした共通のファイルなので編集しない
- `theme`（`base/theme.css`）: デザイントークンとベース要素

## トークン

- カラー等のトークンは `theme.css` の `:root` に CSS 変数で定義し、`var(--…)` で参照する
- 新しい色は既存の命名（`--color-*`）にそろえる

## メディアクエリ

ブレークポイントは `base/breakpoint.css` のカスタムメディアクエリで書きます。lightningcss がビルド時に展開します。

```css
@media (--md) {
  /* 768px 以下 */
}
```

## Sass

Sass（SCSS）は標準では含まれていません。
Biome は `.scss` を処理しないため、導入すると整形と lint を担うツールがなくなり、Prettier と Stylelint の追加が必要になります。
代替可否の判断基準と移行手順は [Sass を使う](sass.md) にまとめています。
