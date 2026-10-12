# AGENTS.md

Vite ベースの静的サイト制作テンプレート。

## 作業の流れ

- 作業を終える前に `pnpm fix`（Biome fix + Markuplint）を実行する
- ユーザーへの回答は日本語で行う

## JavaScript

- 本番コードで `console.log` を使わない。必要な場合は `// biome-ignore lint/suspicious/noConsole: <理由>` を付ける
- 非同期処理は `try...catch` で扱う

## CSS

`@layer` で次の 2 層に分ける。`reset` が先、`theme` が後。

- `reset`: リセット
- `theme`: デザイントークンとベース要素

## HTML

- `.markuplintrc` のルールに従う
- セマンティックなタグと ARIA を維持する
