**目次**

- [開発環境](#開発環境)
  - [ローカル環境構築](#ローカル環境構築)
  - [主要コマンド](#主要コマンド)
- [構成](#構成)
- [含めていないもの](#含めていないもの)
- [Gitフック](#gitフック)

## 開発環境

- Node.js 24 以上
- pnpm 12 以上
- [Vite+](https://viteplus.dev/)（Vite / Vitest / Oxlint / Oxfmt / タスクランナー）
- [React](https://react.dev/)
- [Hono](https://hono.dev/)
- [zod](https://zod.dev/)
- [mise](https://mise.jdx.dev/) (Tool Management)

> [!TIP]
> このプロジェクトではツールバージョン管理に [mise](https://mise.jdx.dev/) を推奨しています。  
> インストール済みであれば `mise install` で適切な環境が整います。

---

### ローカル環境構築

**依存関係インストール**（Git フックも入ります）

```sh
pnpm install
```

**サーバーの起動**

```sh
pnpm dev
```

web（ http://localhost:5173/ ）と api（ http://localhost:8787/api ）が同時に起動します。web の `/api` へのリクエストは api へ転送されます。

### 主要コマンド

| コマンド       | 説明                                       | 実行コマンド |
| -------------- | ------------------------------------------ | ------------ |
| 開発サーバー   | web と api を起動                          | `pnpm dev`   |
| ビルド         | 各パッケージの `build` を実行              | `pnpm build` |
| テスト         | Vitest でテスト                            | `pnpm test`  |
| チェック       | 整形・静的解析・型チェック（書き換えない） | `pnpm lint`  |
| チェック・修正 | 整形と自動修正                             | `pnpm fix`   |

## 構成

```
apps/web/        React の画面。Hono RPC（hc）で api を型付きで呼ぶ
apps/api/        Hono の API。app.ts が本体、index.ts はローカル開発用の入口
packages/core/   zod のスキーマ。api の入力検証と web のフォーム検証の両方で使う
packages/ui/     React の部品
vite.config.ts   整形・静的解析・フックで実行する処理の設定（全パッケージ共通）
```

- パッケージ間の依存は `workspace:*`、外部の依存の版は `pnpm-workspace.yaml` の `catalog` でそろえます
- `packages/*` はビルドしません。`exports` が `src/*.ts` を直接指し、使う側（Vite と Vitest）がそのまま読み込みます

## 含めていないもの

案件ごとに決めるものは入れていません。必要になったら足してください。

- デプロイ先とその設定。決まったら `apps/api/src/index.ts` をその環境の入口に置き換えます（`app.ts` はそのまま使えます）
- DB・ORM、認証
- ルーター、状態管理、CSS の方式、UI ライブラリ
- E2E テスト

## Gitフック

Vite+ のフック（`.vite-hooks/`）を使います。`pnpm install` のときに `vp config` で有効になります。

- **pre-commit**: ステージしたファイルに `vp check --fix` を実行します。整形した結果はそのままコミットに含まれます
