# Repository Guidelines

## 開発環境

```bash
pnpm start          # WordPress + Mailpit + Vite
pnpm wp-env start   # WordPress のみ
pnpm dev            # Vite のみ
pnpm stop           # 停止
pnpm destroy        # 環境を完全削除（データも消える）
```

- WordPress: `http://localhost:8888`（管理画面: admin / password）
- Vite: `http://localhost:3000`（停止中は `pnpm build` 済みの `theme/dist` を自動利用）

## ビルド・リント

```bash
pnpm build       # ブロック + Vite 本番ビルド
pnpm lint        # format / stylelint / eslint
pnpm format      # Prettier（PHP は対象外。VS Code の Intelephense で整形）
pnpm stylelint   # CSS 自動修正
pnpm eslint      # JS/TS 自動修正
```

## データベース

```bash
pnpm backup:db                           # → sql/backup-YYYYMMDD.sql
pnpm import:db ./sql/backup-YYYYMMDD.sql
```

## テーマ構成

- `theme/functions.php` — Vite アセット読み込み、HMR
- `theme/src/` — ソース（JS, CSS, 画像）
- `theme/dist/` — ビルド出力（Git 管理外）
- `theme/blocks/` — カスタムブロック（`@wordpress/scripts`）

## カスタムブロック

```bash
pnpm blocks:new <name>   # theme/blocks/<name>/ に生成
pnpm blocks:build        # theme/blocks/build/ にビルド
pnpm blocks:start        # watch ビルド
```

`theme/functions/blocks.php` が `build/*/block.json` を走査して自動登録する。
