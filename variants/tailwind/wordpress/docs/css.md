# CSS の書き方（Tailwind CSS）

[Tailwind CSS v4](https://tailwindcss.com/) を公式の Vite プラグイン（`@tailwindcss/vite`）で読み込んでいます。リセットは Tailwind の preflight です。

## ファイル

- `theme/src/assets/css/index.css`: 入口。`tailwindcss` と `base/theme.css` を読み込む。`theme/` 配下の PHP と JS に書いたクラスを出力する
- `theme/src/assets/css/base/theme.css`: デザイントークン（`@theme`）とベース要素（`@layer base`）
- `theme/src/assets/css/pages/`: ページ別 CSS。Tailwind を通さない普通の CSS としてビルドされる

## スタイルはユーティリティで書く

```php
<h1 class="text-4xl font-bold max-md:text-2xl"><?php bloginfo("name"); ?></h1>
```

- `@apply` は使わない。同じ組み合わせが続くときはテンプレートパーツにまとめるか、`@utility` で名前を付ける
- ユーティリティで書きにくいもの（複雑な `@keyframes` など）だけ CSS に書く
- クラス名を PHP で組み立てない（`"text-" . $color` など）。Tailwind はソースに書かれた文字列からクラスを探すため、組み立てたクラスは出力されない

## トークン

- カラー等のトークンは `theme.css` の `@theme` に定義する。`--color-ring` から `ring-ring` や `text-ring` などのユーティリティが生成される
- `@theme` の変数は `:root` にも出力され、ページ別 CSS からも `var(--color-ring)` で参照できる。ただし、`theme/` のどこでも使われていない変数は出力されない
- 新しい色は既存の命名（`--color-*`）にそろえる

## ベース要素

要素セレクタのスタイルは `theme.css` の `@layer base` の中に書きます。レイヤーの外に書くとユーティリティより優先され、要素にクラスを付けても効かなくなります。

## ブレークポイント

Tailwind の既定（`sm` 640px / `md` 768px / `lg` 1024px …）を使います。`md:` は「768px 以上」、`max-md:` は「768px 未満」です。
