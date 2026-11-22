# AGENTS.md

React（`apps/web`）と Hono（`apps/api`）の Web アプリ。pnpm workspace のモノレポで、ツールは Vite+（`vp`）にまとめている。

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

## CSS

- `docs/css.md` に従う

## Vite+

- `vp <名前>` は組み込みコマンド、`vp run <名前>` は `package.json` のスクリプト。`vp dev` と `vp run dev` は別物
- 整形・lint の設定はルートの `vite.config.ts` にまとめ、パッケージ側に `fmt` / `lint` を書かない（パッケージ別の設定は `overrides`）
- ドキュメントは `node_modules/vite-plus/docs` にある
