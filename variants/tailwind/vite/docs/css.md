# CSS の書き方（Tailwind CSS）

[Tailwind CSS v4](https://tailwindcss.com/) を公式の Vite プラグイン（`@tailwindcss/vite`）で読み込んでいます。リセットは Tailwind の preflight です。

## ファイル

- `src/assets/css/index.css`: 入口。`tailwindcss` と `base/theme.css` を読み込む
- `src/assets/css/base/theme.css`: デザイントークン（`@theme`）とベース要素（`@layer base`）

## スタイルはユーティリティで書く

```html
<h1 class="text-4xl font-bold max-md:text-2xl">Vite Template</h1>
```

- `@apply` は使わない。同じ組み合わせが続くときは HTML の構造を見直すか、`@utility` で名前を付ける
- ユーティリティで書きにくいもの（複雑な `@keyframes` など）だけ CSS に書く

## トークン

- カラー等のトークンは `theme.css` の `@theme` に定義する。`--color-ring` から `ring-ring` や `text-ring` などのユーティリティが生成される
- `@theme` の変数は `:root` にも出力され、CSS から `var(--color-ring)` で参照できる。ただし、ソースのどこでも使われていない変数は出力されない
- 新しい色は既存の命名（`--color-*`）にそろえる

## ベース要素

要素セレクタのスタイルは `theme.css` の `@layer base` の中に書きます。レイヤーの外に書くとユーティリティより優先され、要素にクラスを付けても効かなくなります。

## ブレークポイント

Tailwind の既定（`sm` 640px / `md` 768px / `lg` 1024px …）を使います。`md:` は「768px 以上」、`max-md:` は「768px 未満」です。
