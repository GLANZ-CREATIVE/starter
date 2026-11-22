# CSS の書き方（Tailwind CSS）

[Tailwind CSS v4](https://tailwindcss.com/) を公式の Vite プラグイン（`@tailwindcss/vite`）で読み込んでいます。リセットは Tailwind の preflight です。

## ファイル

- `src/styles/global.css`: 入口。`tailwindcss` と `theme.css` を読み込む。`BaseLayout.astro` が読み込む
- `src/styles/theme.css`: デザイントークン（`@theme`）とベース要素（`@layer base`）

## スタイルはユーティリティで書く

```astro
<h1 class="text-accent md:text-4xl">Astro</h1>
```

- `@apply` は使わない。同じ組み合わせが続くときはコンポーネントに切り出す
- scoped `<style>` は、複雑な `@keyframes` アニメーションなどユーティリティで書きにくいものに限る
- クラス名を文字列連結で組み立てない（`` `text-${color}` `` など）。Tailwind はソースに書かれた文字列からクラスを探すため、組み立てたクラスは出力されない

## トークン

- カラー等のトークンは `theme.css` の `@theme` に定義する。`--color-accent` から `text-accent` や `bg-accent` などのユーティリティが生成される
- `@theme` の変数は `:root` にも出力され、scoped `<style>` からも `var(--color-accent)` で参照できる。ただし、`src/` のどこでも使われていない変数は出力されない
- 新しい色は既存の命名（`--color-*`）にそろえる
- フォントは `font-sans`（Inter + Noto Sans JP）を使う

## ベース要素

要素セレクタのスタイルは `theme.css` の `@layer base` の中に書きます。レイヤーの外に書くとユーティリティより優先され、要素にクラスを付けても効かなくなります。

## ブレークポイント

Tailwind の既定（`sm` 640px / `md` 768px / `lg` 1024px …）を使います。`md:` は「768px 以上」、`max-md:` は「768px 未満」です。
