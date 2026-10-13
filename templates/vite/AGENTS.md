# AGENTS.md

Vite ベースの静的サイト制作テンプレート。

## 作業の流れ

- 作業を終える前に `pnpm fix`（Biome fix + Markuplint）を実行する

## 規約

- コメントは「why」「why not」のみ。意図的負債は `FIXME` + 理由

## CSS

`@layer` で次の 2 層に分ける。`reset` が先、`theme` が後。

- `reset`: リセット
- `theme`: デザイントークンとベース要素
