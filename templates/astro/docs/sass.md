# Sass を使う

Astro は Vite 経由で Sass を扱えます。パッケージを入れれば、`.scss` と `<style lang="scss">` がそのまま使えます。`astro.config.mjs` は触りません。

> 動作確認: Astro 7.3 / sass 1.105 / stylelint 17 / pnpm 12

## 1. パッケージを追加

```bash
pnpm add -D sass stylelint-config-standard-scss
pnpm approve-builds '!@parcel/watcher'
```

`sass` が依存する `@parcel/watcher`（Sass CLI の監視用、Astro では不要）のビルドスクリプトを拒否します。これをしないと、pnpm 12 は install のたびに `ERR_PNPM_IGNORED_BUILDS` を出します。

## 2. Stylelint を SCSS 対応にする

`stylelint.config.mjs` の `extends` を差し替えます。`@use` や `@include` を未知の at-rule として弾かなくなり、`.astro` 内の `<style lang="scss">` も SCSS として検査されます。

```diff
- extends: ['stylelint-config-standard', 'stylelint-config-recess-order'],
+ extends: ['stylelint-config-standard-scss', 'stylelint-config-recess-order'],
```

## 3. lint 対象に `.scss` を追加

`package.json` の `lint` / `lint:fix` と、`lefthook.yml` の glob に `scss` を加えます。

```jsonc
// package.json
"lint": "eslint . && stylelint \"**/*.{css,scss,astro}\"",
"lint:fix": "eslint . --fix && stylelint \"**/*.{css,scss,astro}\" --fix",
```

```yaml
# lefthook.yml
- name: prettier
  glob: "*.{js,mjs,cjs,ts,astro,css,scss,json,md,yml,yaml}"
  run: pnpm exec prettier --check {staged_files}

- name: stylelint
  glob: "*.{css,scss,astro}"
  run: pnpm exec stylelint {staged_files}
```

## パーシャルを `@use` で読み込む

変数・mixin は `src/styles/` に `_` 始まりのパーシャルとして置きます。

```scss
// src/styles/_mixins.scss
@use "sass:map";

$breakpoints: (
  md: 768px,
  lg: 1024px,
);

@mixin mq($key) {
  @media (width >= map.get($breakpoints, $key)) {
    @content;
  }
}
```

コンポーネントでは `<style lang="scss">` で `@use` します。`@/` エイリアスは Sass の `@use` でも解決されます。

```astro
<style lang="scss">
  @use "@/styles/mixins" as *;

  .header__inner {
    padding-inline: 1.5rem;

    @include mq(md) {
      padding-inline: 2.5rem;
    }
  }
</style>
```

## 運用上の注意

- `@import` は Dart Sass で非推奨です。パーシャルの読み込みは `@use` / `@forward` を使います
- デザイントークンの置き場は `AGENTS.md` のスタイリング節に従います。Sass 変数はブレークポイントのようにビルド時に確定すればよい値に限定すると、実行時に参照できる CSS 変数と役割が分かれます
- `global.css` を `global.scss` に変える必要はありません。グローバルでも Sass の機能が必要になったときだけ拡張子を変え、`BaseLayout.astro` の import を書き換えます
