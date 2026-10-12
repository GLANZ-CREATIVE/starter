**目次**

- [開発環境](#開発環境)
  - [ローカル環境構築](#ローカル環境構築)
  - [主要コマンド](#主要コマンド)
- [CSS](#css)
- [画像最適化](#画像最適化)
- [Gitフック](#gitフック)
  - [pre-commit（コミット前）](#pre-commitコミット前)
  - [pre-push（プッシュ前）](#pre-pushプッシュ前)

## 開発環境

- Node.js 24 以上
- pnpm 12 以上
- [Vite](https://vite.dev/)
- [Biome](https://biomejs.dev/) (Linter & Formatter)
- [lightningcss](https://lightningcss.dev/) (CSS Transformer & Minifier)
- [markuplint](https://markuplint.dev/) (HTML Linter)
- [Lefthook](https://github.com/evilmartians/lefthook)
- [mise](https://mise.jdx.dev/) (Tool Management)

> [!TIP]
> このプロジェクトではツールバージョン管理に [mise](https://mise.jdx.dev/) を推奨しています。  
> インストール済みであれば `mise install` で適切な環境が整います。

---

### ローカル環境構築

**依存関係インストール**

```sh
pnpm install
```

**Lefthook インストール**

```sh
pnpm lefthook install
```

> [!NOTE]
> コミットおよびプッシュ時に自動的にリントとフォーマットが実行されます。

**サーバーの起動**（ http://localhost:5173/ ）

```sh
pnpm dev
```

### 主要コマンド

| コマンド             | 説明                                          | 実行コマンド      |
| -------------------- | --------------------------------------------- | ----------------- |
| 依存関係インストール | プロジェクトの依存関係をインストール          | `pnpm install`    |
| 開発サーバー起動     | 開発用サーバーを起動                          | `pnpm dev`        |
| ビルド               | プロダクション用にビルド                      | `pnpm build`      |
| プレビュー           | ビルド結果をプレビュー                        | `pnpm preview`    |
| フォーマット         | 全ファイルを整形                              | `pnpm format`     |
| リント               | 静的解析を実行（書き換えない）                | `pnpm lint`       |
| チェック             | 整形・静的解析・インポート整理をまとめて検査  | `pnpm check`      |
| HTMLリント           | `markuplint` によるHTMLの検証                 | `pnpm lint:html`  |
| チェック・自動修正   | Biome のチェックと HTML リントをまとめて実行  | `pnpm fix`        |

## CSS

CSS の変換と圧縮には [lightningcss](https://lightningcss.dev/) を使用しています。  
対象ブラウザは `package.json` の `browserslist` から決定され、ネストやカスタムメディアクエリが自動的にトランスパイルされます。

整形と静的解析は Biome が担当します。プロパティの並び替え（`useSortedProperties`）も有効なため、宣言順は自動で統一されます。

> [!NOTE]
> Sass（SCSS）は標準では含まれていません。  
> Biome は `.scss` を処理しないため、導入すると整形役と lint 役が空席になり、Prettier と Stylelint の追加が必要になります。  
> 代替可否の判断基準と移行手順は [docs/sass.md](docs/sass.md) にまとめています。

## 画像最適化

`src/` 配下の画像は、ビルド時に自動的に圧縮・最適化されます。  
対象は JPEG, PNG, GIF, TIFF, WebP, SVG, AVIF で、処理には [vite-plugin-image-optimizer](https://github.com/FatehAK/vite-plugin-image-optimizer) を利用しています。  
品質などの設定は [vite.config.js](vite.config.js) で管理されています。

## Gitフック

[Lefthook](https://github.com/evilmartians/lefthook) を利用して、コミットやプッシュ時に自動で以下の処理が実行されます。  

### pre-commit（コミット前）

- **Biome Check**: JS/CSSのコード整形、静的解析、インポート順序の整理を自動実行（修正可能なものは自動修正）
- **HTML Lint**: `markuplint` によるHTMLの検証

### pre-push（プッシュ前）

- Biome および markuplint によるプロジェクト全体の検証
  - ※エラーがある場合はプッシュできません
