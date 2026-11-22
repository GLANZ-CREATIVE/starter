# AGENTS.md

Astro 7 ベースの SSG スターター。

## 作業の流れ

- 作業を終える前に `pnpm check`（Prettier + ESLint + Stylelint + Markuplint）を実行する

## 規約

- コメントは「why」「why not」のみ。意図的負債は `FIXME` + 理由
- インポートは `@/`（`src/`）エイリアス

## Astro

- `<br>` と `style=""` は ESLint で禁止している。詩のようにどうしても必要な箇所だけ、`{/* eslint-disable-next-line no-restricted-syntax -- 理由 */}` で外す
- 画像は `astro:assets` の `<Image>`。動的・外部 URL は `getImage()`
- フォントは `var(--font-inter)` / `var(--font-noto-sans-jp)` を参照（`astro.config.mjs` で定義済み）

## スタイリング

- `docs/css.md` に従う
