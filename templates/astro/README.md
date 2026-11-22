# Astro Starter

Astro 7 + TypeScript + ESLint + Stylelint + Prettier + Markuplint のテンプレート。

## 技術スタック

- [Astro 7](https://astro.build)
- TypeScript
- [Astro Fonts API](https://docs.astro.build/en/guides/fonts/)（Inter + Noto Sans JP をセルフホスト）
- [astro-seo](https://github.com/jonasmerlin/astro-seo)（OG / Twitter Card 対応）
- [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [astro-robots-txt](https://github.com/alextim/astro-lib/tree/main/packages/astro-robots-txt)
- [ESLint](https://eslint.org)（astro / typescript-eslint / simple-import-sort）
- [Stylelint](https://stylelint.io)（standard + recess-order）
- [Prettier](https://prettier.io)（prettier-plugin-astro）
- [Markuplint](https://markuplint.dev/)（`.astro` の HTML 検証）
- [Lefthook](https://github.com/evilmartians/lefthook)（pre-commit で format / lint、pre-push で `pnpm check`）

## セットアップ

[mise](https://mise.jdx.dev/) で Node.js と pnpm のバージョンを管理しています。

```bash
# mise が未インストールの場合
curl https://mise.run | sh

# Node.js と pnpm をインストール
mise install

# 依存関係のインストール
pnpm install
```

## コマンド

| コマンド            | 説明                                                    |
| :------------------ | :------------------------------------------------------ |
| `pnpm dev`          | 開発サーバー起動                                        |
| `pnpm build`        | 本番ビルド                                              |
| `pnpm preview`      | ビルドのプレビュー                                      |
| `pnpm lint`         | ESLint + Stylelint + Markuplint                         |
| `pnpm lint:fix`     | ESLint と Stylelint を自動修正（Markuplint は検査のみ） |
| `pnpm format`       | Prettier でフォーマット                                 |
| `pnpm format:check` | フォーマットチェック                                    |
| `pnpm check`        | format:check + lint                                     |

## プロジェクト構成

```
/
├── public/
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css   # BaseLayout.astro が読み込む CSS の入口
└── package.json
```

## パスエイリアス

`@/*` → `src/*`

```ts
import Header from "@/components/Header.astro";
```

## サイトURL の変更

`astro.config.mjs` の `site` を本番URLに変更してください。

```js
export default defineConfig({
  site: "https://example.com",
  // ...
});
```

## CSS

CSS の方式（Vanilla CSS / Tailwind CSS）は、作成時に create-starter で選んだものです。書き方は [docs/css.md](docs/css.md) にまとめています。
