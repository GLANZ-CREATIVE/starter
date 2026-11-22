# CSS の書き方（Vanilla CSS）

## レイヤー

`apps/web/src/styles/index.css` で `@layer` を次の順に宣言しています。後のレイヤーほど優先されます。`main.tsx` が読み込みます。

- `reset`（`reset.css`）: リセット。[kiso.css](https://github.com/tak-dcxi/kiso.css) をもとにした共通のファイルなので編集しない
- `theme`（`theme.css`）: デザイントークンとベース要素

## トークン

- カラー等のトークンは `theme.css` の `:root` に CSS 変数で定義し、`var(--…)` で参照する
- 新しい色は既存の命名（`--color-*`）にそろえる

## 部品のスタイル

`packages/ui` の部品に CSS を持たせるときは、部品と同じフォルダに置いて部品から import します。トークンは `var(--…)` で参照し、値を直接書きません。
