# AGENTS.md

WordPress テーマ制作用のテンプレート。Vite でアセットをビルドし、`wp-env` で開発する。

## 作業の流れ

- 作業を終える前に `pnpm lint`（Prettier + Stylelint + ESLint。確認のみ）を実行する。指摘は `pnpm format` / `pnpm stylelint` / `pnpm eslint` で自動修正できる

## 開発環境

- Vite が停止中は、`pnpm build` 済みの `theme/dist` を自動で使う
- `pnpm destroy` は wp-env のコンテナとデータベースを削除する。`uploads/`・`sql/` と Mailpit は残る

## テーマ構成

- `theme/src/` ソース（JS, CSS, 画像）
- `theme/dist/` ビルド出力（Git 管理外）
- `theme/blocks/` カスタムブロック（`@wordpress/scripts`）。`theme/functions/blocks.php` が `build/*/block.json` を走査して自動登録する

## 規約

- コメントは「why」「why not」のみ。意図的負債は `FIXME` + 理由
- PHP は Prettier の対象外。VS Code の Intelephense で整形する
