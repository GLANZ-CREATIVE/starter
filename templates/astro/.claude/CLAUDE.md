# CLAUDE.md

## プロジェクト

Astro 7 ベースの SSG スターター。ベースブランチ `main`、`feature/*` で開発。

## スタック

Astro 7 / TypeScript strict / Astro Fonts API（Inter, Noto Sans JP）/ astro-seo / sitemap / robots-txt / ESLint (astro, ts, jsx-a11y, simple-import-sort) / Stylelint (standard, recess-order) / Prettier / Lefthook / pnpm (Node 24+)

## コマンド

`pnpm dev` / `build` / `preview` / `lint` / `lint:fix` / `format` / `format:check` / `check`

## 構成

- `src/pages/` ルーティング / `src/layouts/` / `src/components/` / `src/styles/`
- パスエイリアス: `@/*` → `src/*`

## ルール

| ファイル                   | 対象                                        |
| -------------------------- | ------------------------------------------- |
| `.claude/rules/astro.md`   | `src/{pages,components,layouts}/**/*.astro` |
| `.claude/rules/styling.md` | `src/styles/**/*.css`, `**/*.astro`         |

## 規約

- コンポーネント・レイアウトは PascalCase
- コメントは「why」「why not」のみ。意図的負債は `FIXME` + 理由
- インタラクティブ UI が必要なときだけフレームワークコンポーネント + `client:` 指定
