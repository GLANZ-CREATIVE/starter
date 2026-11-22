**目次**

- [開発環境](#開発環境)
  - [ローカル環境構築](#ローカル環境構築)
  - [主要コマンド](#主要コマンド)
- [デプロイ](#デプロイ)
- [構成](#構成)
- [含めていないもの](#含めていないもの)
- [Gitフック](#gitフック)

## 開発環境

- Node.js 26 以上
- pnpm 12 以上
- [Vite+](https://viteplus.dev/)（Vite / Vitest / Oxlint / Oxfmt / タスクランナー）
- [React](https://react.dev/)
- [Hono](https://hono.dev/)
- [zod](https://zod.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)（[cf CLI](https://developers.cloudflare.com/cf/) と [Cloudflare の Vite プラグイン](https://developers.cloudflare.com/workers/vite-plugin/)）
- [mise](https://mise.jdx.dev/) (Tool Management)

> [!TIP]
> このプロジェクトではツールバージョン管理に [mise](https://mise.jdx.dev/) を推奨しています。  
> インストール済みであれば `mise install` で適切な環境が整います。

---

### ローカル環境構築

依存関係をインストールします。Git フックも入ります。

```sh
pnpm install
```

サーバーを起動します。

```sh
pnpm dev
```

http://localhost:5173/ で起動します。本番と同じく Workers の実行環境（workerd）の上で、1 つの Worker が web の画面と `/api` の両方を返します。

### 主要コマンド

| コマンド       | 説明                                       | 実行コマンド      |
| -------------- | ------------------------------------------ | ----------------- |
| 開発サーバー   | web と api を起動                          | `pnpm dev`        |
| ビルド         | 各パッケージの `build` を実行              | `pnpm build`      |
| テスト         | Vitest でテスト                            | `pnpm test`       |
| チェック       | 整形・静的解析・型チェック（書き換えない） | `pnpm lint`       |
| チェック・修正 | 整形と自動修正                             | `pnpm fix`        |
| デプロイ       | ビルドして Cloudflare Workers に公開       | `pnpm run deploy` |

`pnpm deploy` は pnpm 自体のコマンドなので、デプロイは `pnpm run deploy` で実行します。

## デプロイ

[cf CLI](https://developers.cloudflare.com/cf/) で Cloudflare Workers に公開します。設定は `apps/web/cloudflare.config.ts` で、Worker 名は作成時に案件名になっています。

1. `pnpm --filter @repo/web exec cf auth login` で Cloudflare にログインする
2. `pnpm run deploy` を実行する（中身は `apps/web` での `cf deploy`）

DB やストレージを使うときは、`cloudflare.config.ts` の `env` にバインディングを足します。Cloudflare のドキュメントには Wrangler（`wrangler.jsonc`）の書き方しか載っていないことがありますが、このプロジェクトでは `cloudflare.config.ts` に書き換えて使い、Wrangler は入れません。

デプロイ先が決まっていない案件も、このまま開発を始めて構いません。Workers で動くコードはほかの環境でも動きます。ほかの環境に移すときは、`apps/api/src/index.ts`（エントリポイント）と `apps/web` の Cloudflare の設定を差し替えます（`app.ts` はそのまま使えます）。

## 構成

```
apps/web/        React の画面。Hono RPC（hc）で api を型付きで呼ぶ。cloudflare.config.ts に Worker の設定
apps/api/        Hono の API。app.ts が本体、index.ts は Workers のエントリポイント
packages/core/   zod のスキーマ。api の入力検証と web のフォーム検証の両方で使う
packages/ui/     React の部品
vite.config.ts   整形・静的解析・フックで実行する処理の設定（全パッケージ共通）
```

- パッケージ間の依存は `workspace:*`、外部の依存のバージョンは `pnpm-workspace.yaml` の `catalog` でそろえます
- `packages/*` はビルドしません。`exports` が `src/*.ts` を直接指し、使う側（Vite と Vitest）がそのまま読み込みます

CSS の方式（Vanilla CSS / Tailwind CSS）は、作成時に create-starter で選んだものです。書き方は [docs/css.md](docs/css.md) にまとめています。

## 含めていないもの

案件ごとに決めるものは入れていません。必要になったら足してください。

- DB・ORM、認証
- ルーター、状態管理、UI ライブラリ
- E2E テスト

## Gitフック

Vite+ のフック（`.vite-hooks/`）を使います。`pnpm install` のときに `vp config` で有効になります。

- **pre-commit**: ステージしたファイルに `vp check --fix` を実行します。整形した結果はそのままコミットに含まれます
