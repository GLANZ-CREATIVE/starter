# CSS の書き方（Tailwind CSS）

[Tailwind CSS v4](https://tailwindcss.com/) を公式の Vite プラグイン（`@tailwindcss/vite`）で読み込んでいます。リセットは Tailwind の preflight です。

## ファイル

- `apps/web/src/styles/index.css`: 入口。`tailwindcss` と `theme.css` を読み込む。`main.tsx` が読み込む
- `apps/web/src/styles/theme.css`: デザイントークン（`@theme`）とベース要素（`@layer base`）

`apps/web` と `packages/ui` に書いたクラスを出力します。ほかのパッケージでクラスを書くときは、`index.css` に `@source` を足します。

## スタイルはユーティリティで書く

```tsx
<h1 className="text-accent md:text-4xl">webapp</h1>
```

- `@apply` は使わない。同じ組み合わせが続くときは `packages/ui` の部品に切り出す
- ユーティリティで書きにくいもの（複雑な `@keyframes` など）だけ CSS に書く
- クラス名を文字列連結で組み立てない（`` `text-${color}` `` など）。Tailwind はソースに書かれた文字列からクラスを探すため、組み立てたクラスは出力されない。変化させるときは、完全なクラス名を値に持つオブジェクトから選ぶ

## トークン

- カラー等のトークンは `theme.css` の `@theme` に定義する。`--color-accent` から `text-accent` や `bg-accent` などのユーティリティが生成される
- `@theme` の変数は `:root` にも出力され、CSS から `var(--color-accent)` で参照できる。ただし、ソースのどこでも使われていない変数は出力されない
- 新しい色は既存の命名（`--color-*`）にそろえる

## ベース要素

要素セレクタのスタイルは `theme.css` の `@layer base` の中に書きます。レイヤーの外に書くとユーティリティより優先され、要素にクラスを付けても効かなくなります。

## ブレークポイント

Tailwind の既定（`sm` 640px / `md` 768px / `lg` 1024px …）を使います。`md:` は「768px 以上」、`max-md:` は「768px 未満」です。
