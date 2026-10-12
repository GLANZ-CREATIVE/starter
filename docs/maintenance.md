# 保守の手順

このリポジトリを保守する人向けの手順です。

## リポジトリの構成

```
.github/workflows/   ci.yml（テスト・秘密情報スキャン・3テンプレートの展開と lint / build）、release.yml（create-starter の公開）
packages/create-starter/   npm に公開する展開コマンド
scripts/sync-shared.js     shared/ をテンプレートへ配る・ずれを検査する
shared/                    全テンプレート共通の原本
templates/                 テンプレート本体（それぞれ単体のプロジェクト。lockfile もそれぞれが持つ）
```

## テンプレートを直す

1. `templates/<名前>/` を直して PR を出します。テンプレートは実行時に GitHub から取るため、npm への公開はいりません。
2. 共通のファイル（`.editorconfig` / `.gitattributes` / `.mise.toml` / `.gitignore` の先頭 / `reset.css`）は、`shared/` の原本を直してから配ります

   ```sh
   pnpm sync:shared    # shared/ を各テンプレートへコピー
   pnpm check:shared   # ずれやバージョンの食い違いがないか確認（CI でも実行）
   ```

   `.gitignore` は `# ---- template specific ----` より上が共通部分です。テンプレート固有の記述はその下に書きます。

3. Node / pnpm のバージョンを上げるときは、`shared/.mise.toml` と各テンプレートの `package.json` の `packageManager` をそろえます（そろっていないと `check:shared` が落ちます）

> [!WARNING]
> このリポジトリの中で、テンプレートのフォルダに `pnpm install` をしないでください。
> `prepare` の `lefthook install` が、テンプレートではなくこのリポジトリの `.git` にフックを入れてしまいます（`LEFTHOOK=0` では止まりません）。
> lockfile だけを更新するときは `pnpm install --lockfile-only` を使います。動作は、展開して確かめます。
>
> ```sh
> CREATE_STARTER_LOCAL_DIR=$PWD node packages/create-starter/index.js vite /tmp/try-vite
> ```

## テンプレートを足す

1. `templates/<名前>/` を置き、`packages/create-starter/lib/templates.js` の `TEMPLATES` に足します（CI の matrix はここから作られます）
2. `scripts/sync-shared.js` の `RESET_CSS_PATHS` に reset.css の配り先を書きます（使わないなら `null`）
3. `.github/dependabot.yml` の npm の `directories` に `/templates/<名前>` を足します
4. `pnpm sync:shared && pnpm check:shared` を実行します
5. create-starter を公開し直す必要があります（テンプレート名の一覧は create-starter の中にあるため）

## create-starter を公開する

`create-starter` 自体を変えたときだけ公開します。

1. `packages/create-starter/package.json` の `version` を上げて `main` に入れます
2. `create-starter@v<version>` のタグを push します（例: `git tag create-starter@v0.2.0 && git push origin create-starter@v0.2.0`）
3. `release.yml` が Trusted Publishing で npm に公開します。npm のトークンはリポジトリに置きません
