# starter

Web サイト制作用のテンプレート。  
ビルド環境と Lint を設定済みの WordPress、Vite、Astro、Web アプリのプロジェクトを生成します。

| テンプレート | 内容                                                                   |
| ------------ | ---------------------------------------------------------------------- |
| `wordpress`  | WordPress（wp-env + Vite + Mailpit）。Docker が必要                    |
| `vite`       | Vite の静的サイト（Biome / Markuplint）                                |
| `astro`      | Astro の静的サイト（ESLint / Stylelint / Prettier / Markuplint）       |
| `webapp`     | React + Hono の Web アプリ。pnpm workspace のモノレポ（Vite+ / zod） |

CSS の方式は、どのテンプレートでも次の 2 つから選べます。

| CSS の方式 | 内容                                                            |
| ---------- | --------------------------------------------------------------- |
| `vanilla`  | Vanilla CSS。共通のリセット（kiso.css ベース）と `@layer` で書く |
| `tailwind` | Tailwind CSS v4。リセットは preflight                           |

## 使い方

```sh
pnpm create @glanz-creative/starter <テンプレート名> <プロジェクト名> --css <vanilla / tailwind>

# 例
pnpm create @glanz-creative/starter vite my-site --css tailwind
```

- 事前に mise をインストールしておきます。
- 引数を省くと、対話で聞かれます。対話できない環境（CI など）では、すべて引数で渡します。`--help` で使い方を表示します
- 次の順に実行します: テンプレートの展開（Tailwind CSS なら差分を重ねる） → `package.json` の `name` の置き換え → `git init` → `mise trust` → `mise install` → `pnpm install --frozen-lockfile` → 最初のコミット
- GitHub にリポジトリは作らず、push もしません
- テンプレートは実行のたびにこのリポジトリの `main` から取得します。取得したコミットは、最初のコミットの本文に `参照元: GLANZ-CREATIVE/starter@main (<SHA>)` として残ります
- 過去の状態で作り直すときは、その SHA を `--ref` に渡します（ブランチやタグも指定できます）

```sh
pnpm create @glanz-creative/starter astro my-site --css vanilla --ref 0123456789abcdef0123456789abcdef01234567
```

## 保守

保守の手順は [docs/maintenance.md](docs/maintenance.md) にあります。

## ライセンス

[MIT](LICENSE)
