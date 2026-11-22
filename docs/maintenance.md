# 保守の手順

このリポジトリを保守する人向けの手順です。

## リポジトリの構成

```
.github/workflows/   ci.yml（テスト・秘密情報スキャン・各テンプレート × CSS の方式の展開と lint / test / build）、release.yml（create-starter の公開）
packages/create-starter/   npm に公開する展開コマンド
scripts/sync-shared.js     shared/ をテンプレートへ配る・ずれを検査する
scripts/lock-variants.js   差分を重ねた状態の lockfile を作る
shared/                    全テンプレート共通の原本
templates/                 テンプレート本体（Vanilla CSS 版。それぞれ単体のプロジェクトで、lockfile もそれぞれが持つ）
variants/tailwind/         Tailwind CSS 版の差分（templates/<名前>/ に重ねる）
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
> `prepare` の `lefthook install`（`webapp` は `vp config`）が、テンプレートではなくこのリポジトリの `.git` にフックを入れてしまいます（`LEFTHOOK=0` では止まりません）。
> lockfile だけを更新するときは `pnpm install --lockfile-only` を使います。動作は、展開して確かめます。
>
> ```sh
> CREATE_STARTER_LOCAL_DIR=$PWD node packages/create-starter/index.js vite /tmp/try-vite --css tailwind
> ```

## CSS の方式ごとの差分

`templates/<名前>/` は Vanilla CSS 版です。Tailwind CSS 版は、その上に `variants/tailwind/<名前>/` を重ねて作ります。差分には、方式で変わるファイル（`package.json`・lockfile・Vite の設定・CSS・lint の設定・`docs/css.md`）だけを置きます。

差分のフォルダの `.variant.json` が、重ねたあとの扱いを決めます。展開したプロジェクトには残りません。

```json
{
  "remove": ["src/assets/css/base/reset.css", "docs/sass.md"],
  "extends": ["package.json", "vite.config.js", "biome.json"]
}
```

- `remove`: 共通部分から消すファイル。Tailwind CSS 版は preflight を使うので、reset.css は必ず消します
- `extends`: 共通部分に行を足しただけのファイル。共通部分の行がすべて同じ順で入っているかを `check:shared` が検査します。`package.json` と `pnpm-workspace.yaml` を差分に置くときは、必ず入れます

共通部分を直したら、差分の側も追いかけます。

1. `pnpm check:shared` が、差分の `extends` のファイルに取り込まれていない行を報告します。差分のファイルを同じように直します
2. 依存を変えたときは `pnpm lock:variants [テンプレート名...]` で差分の lockfile を作り直します。一時フォルダで差分を重ねてから `pnpm install --lockfile-only` を実行します
3. `extends` に入れていないファイル（CSS、`docs/css.md` など）は丸ごと置き換えているので、検査されません。共通部分の同じファイルを直したら、差分も見直します

Dependabot は `templates/` だけを更新します。Dependabot の PR は差分の `package.json` とずれて `check:shared` で落ちるので、そのブランチで差分の `package.json` を直し、`pnpm lock:variants` を実行して push します。Tailwind CSS 自体の版も、差分の `package.json`（webapp は `pnpm-workspace.yaml` の `catalog`）を手で上げてから `pnpm lock:variants` を実行します。

## テンプレートを足す

1. `templates/<名前>/` を置き、`packages/create-starter/lib/templates.js` の `TEMPLATES` と `lib/prompt.js` の `PRESENTATION` に足します（CI の matrix は `TEMPLATES` から作られます）。`scripts/sync-shared.js` の `FORMATTER_CONFIGS` と `GIT_HOOKS` にも足します
2. `scripts/sync-shared.js` の `RESET_CSS_PATHS` に reset.css の配り先を書きます（使わないなら `null`）
3. `variants/tailwind/<名前>/` に Tailwind CSS 版の差分と `.variant.json` を置き、`pnpm lock:variants <名前>` で lockfile を作ります
4. `.github/dependabot.yml` の npm の `directories` に `/templates/<名前>` を足します
5. `pnpm sync:shared && pnpm check:shared` を実行します
6. create-starter を公開し直す必要があります（テンプレート名の一覧は create-starter の中にあるため）

## create-starter を公開する

`create-starter` 自体を変えたときだけ公開します。

1. `packages/create-starter/package.json` の `version` を上げて `main` に入れます
2. `create-starter@v<version>` のタグを push します（例: `git tag create-starter@v0.2.0 && git push origin create-starter@v0.2.0`）
3. `release.yml` が Trusted Publishing で npm に公開します。npm のトークンはリポジトリに置きません
