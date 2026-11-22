# AGENTS.md

Web サイト制作用テンプレート（`wordpress` / `vite` / `astro`）と、それを展開する `@glanz-creative/create-starter` のリポジトリ。保守手順の詳細は `docs/maintenance.md`。

## コマンド

- `pnpm test`: `scripts/*.test.js` と `packages/*/test/*.test.js` を `node --test` で実行
- 単一ファイル: `node --test packages/create-starter/test/<名前>.test.js`
- `pnpm sync:shared`: `shared/` の原本を各テンプレートへ配る
- `pnpm check:shared`: 配布物のずれ・版の食い違い・差分（`variants/`）が共通部分を取り込んでいるかを検査（CI でも実行）
- `pnpm lock:variants [テンプレート名...]`: 差分を重ねた状態で `pnpm install --lockfile-only` を実行し、差分の lockfile を作り直す
- 動作確認は展開して行う: `CREATE_STARTER_LOCAL_DIR=$PWD node packages/create-starter/index.js vite /tmp/try-vite --css tailwind`

## 構成

- `templates/<名前>/`: テンプレート本体（Vanilla CSS 版）。それぞれ単体のプロジェクトで、lockfile も個別に持つ。`pnpm-workspace.yaml` に入れない
- `variants/tailwind/<名前>/`: Tailwind CSS 版の差分。`templates/<名前>/` に重ねる。`.variant.json` の `remove` で共通部分のファイルを消し、`extends` に挙げたファイルは共通部分の行をすべて含むことを `check:shared` が検査する。CSS の方式の一覧は `lib/templates.js` の `CSS_METHODS`
- `shared/`: 全テンプレート共通ファイルの原本（`.editorconfig` / `.gitattributes` / `.mise.toml` / `.gitignore` の先頭 / `reset.css`）。テンプレート側を直接編集せず、原本を直して `pnpm sync:shared` で配る
- `.gitignore` は `# ---- template specific ----` より上が共通部分。固有の記述は下に書く
- `packages/create-starter/`: 展開コマンド。テンプレート名の一覧は `lib/templates.js` の `TEMPLATES` が唯一の定義で、CI の matrix と `scripts/sync-shared.js` もここを参照する
- テンプレートは実行時に GitHub の `main` から取得されるため、テンプレートの修正に npm 公開は不要。`create-starter` 自体を変えたときだけ `create-starter@v<version>` タグで公開する

## 注意

- このリポジトリ内でテンプレートのフォルダに `pnpm install` をしない。`prepare` の `lefthook install`（`webapp` は `vp config`）がこのリポジトリの `.git` にフックを入れる（`LEFTHOOK=0` では止まらない）。lockfile 更新は `pnpm install --lockfile-only`
- Node / pnpm の版を上げるときは `shared/.mise.toml` と各テンプレートの `package.json`（`packageManager`, `engines.node`）をそろえる
- `check:shared` は次も強制する: lefthook を使うテンプレート間で lefthook の版が同じ、`lefthook.yml` は `jobs:` を使い pre-commit に `stage_fixed: true`、`webapp` は `.vite-hooks/pre-commit` で `vp staged`、フォーマッタの行幅 150・ダブルクォート・末尾カンマ（`webapp` は `vite.config.ts` の `fmt`）
- テンプレートを直したら、Tailwind CSS 版の差分も追いかける。依存を変えたら `pnpm lock:variants`
- テンプレートを足すときは `lib/templates.js`、`lib/prompt.js` の `PRESENTATION`、`scripts/sync-shared.js` の `RESET_CSS_PATHS` / `FORMATTER_CONFIGS` / `GIT_HOOKS`、`variants/tailwind/<名前>/`、`.github/dependabot.yml` を更新し、create-starter を公開し直す

## テンプレートの AGENTS.md

`templates/*/AGENTS.md` は、展開先のプロジェクトで使う指示。このリポジトリの作業指示ではない。
