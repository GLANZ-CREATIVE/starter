# starter

サイト制作用のスターターテンプレートです。ビルド環境と Lint を設定済みの WordPress、Vite、Astro のプロジェクトを生成します。

> [!NOTE]
> 社内用のリポジトリです。外部からの Issue や Pull Request は受け付けていません。

| テンプレート | 内容                                                |
| ------------ | --------------------------------------------------- |
| `wordpress`  | WordPress（wp-env + Vite + Mailpit）。Docker が必要 |
| `vite`       | Vite の静的サイト（Biome / Markuplint）             |
| `astro`      | Astro の静的サイト（ESLint / Stylelint / Prettier） |

## 使い方

```sh
pnpm create @glanz-creative/starter <テンプレート名> <フォルダ名>
# 例
pnpm create @glanz-creative/starter vite my-site
```

- 事前に mise をインストールしておきます。`npm create @glanz-creative/starter ...` でも動きます
- 引数を省くと、対話で聞かれます
- 次の順に実行します: テンプレートの展開 → `package.json` の `name` の置き換え → `git init` → `mise install` → `pnpm install` → 最初のコミット
- GitHub にリポジトリは作らず、push もしません
- テンプレートは実行のたびにこのリポジトリの `main` から取得します。取得したコミットは、最初のコミットの本文に `参照元: GLANZ-CREATIVE/starter@main (<SHA>)` として残ります
- 過去の状態で作り直すときは、その SHA を `--ref` に渡します（ブランチやタグも指定できます）

```sh
pnpm create @glanz-creative/starter astro my-site --ref 0123456789abcdef0123456789abcdef01234567
```

## 保守

保守の手順は [docs/maintenance.md](docs/maintenance.md) にあります。

## ライセンス

[MIT](LICENSE)
