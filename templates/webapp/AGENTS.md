# AGENTS.md

React（`apps/web`）と Hono（`apps/api`）の Web アプリ。pnpm workspace のモノレポで、ツールは Vite+（`vp`）にまとめている。Cloudflare Workers で動かし、1 つの Worker が web の画面と `/api` を返す（設定は `apps/web/cloudflare.config.ts`）。

## 作業の流れ

- 作業を終える前に `pnpm fix` と `pnpm test` を実行する
- 外部の依存は `pnpm-workspace.yaml` の `catalog` に版を書き、`package.json` では `catalog:` を指定する

## 規約

- コメントは「why」「why not」のみ。意図的負債は `FIXME` + 理由
- 相対 import は拡張子（`.ts` / `.tsx`）まで書く
- テストは `vite-plus/test` から import する

## 責務の分け方

- 入力の形と検証ルールは `packages/core` の zod スキーマに置き、api と web で共有する。api は境界で検証し、内部では型を信頼する
- web から api を呼ぶときは `apps/web/src/api.ts` の Hono RPC クライアントを使う。URL や型を手書きしない
- `apps/api/src/app.ts` は実行環境に依存させない。環境ごとの起動処理は入口（`index.ts`）に置く
- api のコードは Workers で動く Web 標準の API で書く。Node.js 専用の API（`node:fs` など）は使わない
- D1・KV・R2 などの Cloudflare 固有のサービス（バインディング）は、デプロイ先が Cloudflare に決まってから使う

## Cloudflare

- Cloudflare の操作は `cf` CLI で行う。Wrangler を入れない、`wrangler.jsonc` を作らない
- ドキュメントの `wrangler` コマンドや `wrangler.jsonc` の設定は、そのまま使わず `cf` と `cloudflare.config.ts` に置き換える。対応は https://developers.cloudflare.com/cf/wrangler/reference/ で調べ、記憶で置き換えない
- `cf deploy` は本番に公開する。人に頼まれたときだけ実行し、確認には `cf deploy --dry-run` を使う

## CSS

- `docs/css.md` に従う

## Vite+

- `vp <名前>` は組み込みコマンド、`vp run <名前>` は `package.json` のスクリプト。`vp dev` と `vp run dev` は別物
- 整形・lint の設定はルートの `vite.config.ts` にまとめ、パッケージ側に `fmt` / `lint` を書かない（パッケージ別の設定は `overrides`）
- ドキュメントは `node_modules/vite-plus/docs` にある
