# Astro Starter

Astro 7 + TypeScript + ESLint + Stylelint + Prettier のテンプレート。

## 技術スタック

- [Astro 7](https://astro.build)
- TypeScript
- [Astro Fonts API](https://docs.astro.build/en/guides/fonts/)（Inter + Noto Sans JP をセルフホスト）
- [astro-seo](https://github.com/jonasmerlin/astro-seo)（OG / Twitter Card 対応）
- [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [astro-robots-txt](https://github.com/alextim/astro-lib/tree/main/packages/astro-robots-txt)
- [kiso.css v1.2.4](https://github.com/tak-dcxi/kiso.css)（日本語Web向けリセットCSS）
- [ESLint](https://eslint.org)（astro / typescript-eslint / jsx-a11y / simple-import-sort）
- [Stylelint](https://stylelint.io)（standard + recess-order）
- [Prettier](https://prettier.io)（prettier-plugin-astro）
- [Lefthook](https://github.com/evilmartians/lefthook)（pre-commit で format / lint を自動実行）

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

| コマンド            | 説明                    |
| :------------------ | :---------------------- |
| `pnpm dev`          | 開発サーバー起動        |
| `pnpm build`        | 本番ビルド              |
| `pnpm preview`      | ビルドのプレビュー      |
| `pnpm lint`         | ESLint + Stylelint      |
| `pnpm lint:fix`     | 自動修正                |
| `pnpm format`       | Prettier でフォーマット |
| `pnpm format:check` | フォーマットチェック    |
| `pnpm check`        | format:check + lint     |

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
│       ├── global.css
│       └── kiso.css
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

## CSS の拡張

Sass や Tailwind CSS は次の手順で足せます。

- [Sass を使う](docs/sass.md)
- [Tailwind CSS を使う](docs/tailwind.md)
