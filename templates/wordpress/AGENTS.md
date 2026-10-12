# AGENTS.md

WordPress テーマ制作用のテンプレート。Vite でアセットをビルドし、`wp-env` で開発する。

## 開発環境

- Vite が停止中は、`pnpm build` 済みの `theme/dist` を自動で使う
- `pnpm destroy` は環境をデータごと削除する

## テーマ構成

- `theme/src/` ソース（JS, CSS, 画像）
- `theme/dist/` ビルド出力（Git 管理外）
- `theme/blocks/` カスタムブロック（`@wordpress/scripts`）。`theme/functions/blocks.php` が `build/*/block.json` を走査して自動登録する

## 規約

- PHP は Prettier の対象外。VS Code の Intelephense で整形する
