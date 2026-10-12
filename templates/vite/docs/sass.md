# Sass を使う場合

このテンプレートは **lightningcss + ネイティブ CSS** で構成されており、Sass は標準で入っていません。
Sass を導入する場合、CSS まわりのツール構成を丸ごと組み替える必要があります。

## 1. 代替可能かを確認する

ネイティブ CSS で代替できる機能は多くあります。
まずは、Sass を導入する前に、ネイティブ CSS で代替可能か確認してください。

| Sass の機能                | ネイティブ CSS の代替      | 代替可否 |
| -------------------------- | -------------------------- | -------- |
| ネスト                     | CSS Nesting                | 可       |
| 変数                       | カスタムプロパティ (`--x`) | 可       |
| 色関数                     | `color-mix()` / 相対色構文 | ほぼ可   |
| ファイル分割               | `@layer` / Vite のバンドル | ほぼ可   |
| `&__el` / `&--mod` の連結  | なし                       | **不可** |
| `@mixin` / `@include`      | なし                       | **不可** |
| `@each` / `@for` ループ    | なし                       | **不可** |
| マップ (`map.get`)         | なし                       | **不可** |
| `@extend` / `%placeholder` | なし                       | **不可** |
| `@function`                | なし                       | **不可** |

## 2. 導入手順

現時点の Biome は `.scss` を対象ファイルとして認識せず、渡しても無視します。
[Language support](https://biomejs.dev/internals/language-support/) でも、SCSS は parser と formatter が開発中、lint は未着手です。
つまり Sass を入れると SCSS の整形役と lint 役が同時に空席になるため、両方を補う必要があります。

Stylelint だけでは足りない点に注意してください。Stylelint は v15 でフォーマット系ルール（`indentation`、`string-quotes` など）を非推奨化し、v16 で削除しました。
現在は **整形しない lint 専用ツール**なので、lint を Stylelint、整形を Prettier が分担します。

### 2-1. パッケージ追加

```bash
pnpm add -D sass-embedded \
  prettier \
  stylelint \
  stylelint-config-standard-scss \
  stylelint-config-recess-order
```

`sass` ではなく `sass-embedded` を使います。前者は純粋な JavaScript 実装、後者はネイティブの Dart 実行ファイルを利用する実装で、後者のほうが高速です。
どちらも同じ Dart Sass で API も同一のため、置き換えても書き方は変わりません。
Vite はインストール済みであれば `sass-embedded` を自動的に優先するため、どちらを使うかの設定は不要です。

> `sass-embedded` は Dart が対応するプラットフォーム（Windows / macOS / Linux）にしか導入できません。
> それ以外の環境でビルドする場合は `sass` を使ってください。

### 2-2. Vite の設定

Vite は `.scss` を拡張子で自動的に判別するため、設定は不要です。
既存の `css.transformer: "lightningcss"` もそのまま残します。Sass がコンパイルした CSS を lightningcss が受け取る形になります。

全ファイルへ共通の変数や mixin を注入したい場合のみ、`vite.config.js` の既存の `css` キーに `preprocessorOptions` を追加します。ファイル全体を置き換えないでください。

```js
  css: {
    transformer: "lightningcss",
    lightningcss: {
      /* 既存のまま */
    },
    // ↓ ここを追加
    preprocessorOptions: {
      scss: {
        additionalData: `@use "./src/assets/css/_variables.scss" as *;`,
      },
    },
  },
```

このリポジトリには `resolve.alias` の定義がないため、`@/` のようなエイリアスは使えません。相対パスで書くか、別途 `resolve.alias` を追加してください。

### 2-3. Biome から CSS の責務を外す

Stylelint に全面移行するため、まずスタイルシートを Biome の対象から除外します。
`biome.json` の `files.includes` に除外パターンを 2 つ追加してください（配列ごと置き換えず、末尾に足します）。

```json
  "files": {
    "ignoreUnknown": false,
    "includes": ["**", "!**/*.md", "!**/*.css", "!**/*.scss"]
  },
```

この除外だけで CSS 系の設定は無効になります。ただし設定が残っていると、どちらのツールが CSS を見ているのか読み取れなくなるため、あわせて次を削除します。

- `css` セクション全体（`parser` / `formatter` / `linter`）
- `linter.rules` 内の CSS 系ルール（`correctness` / `suspicious` / `a11y` / `style` に散在します。`noUnknown*`、`noDuplicate*`、`useGenericFontNames`、`noDescendingSpecificity` など）
- `assist.actions.source.useSortedProperties`
- `overrides` のうち、CSS ファイルを対象にしているエントリ

`useSortedProperties` による並び替えは、`src` 配下については `stylelint-config-recess-order` が引き継ぎます。

### 2-4. Stylelint の設定

`.stylelintrc.json` を作成します。

```json
{
  "extends": ["stylelint-config-standard-scss", "stylelint-config-recess-order"],
  "rules": {
    "selector-class-pattern": null,
    "scss/at-mixin-pattern": null
  },
  "ignoreFiles": ["**/node_modules/**", "dist/**", "**/*.min.css"]
}
```

`stylelint-config-recess-order` が、Biome の `useSortedProperties` に相当するプロパティ並び替えを担います。
Biome と違い**並び順をカスタマイズできる**点が利点です。

### 2-5. Prettier の設定

`.prettierrc.json` を作成します。整形幅は `biome.json` の `lineWidth: 150` に揃えます。

```json
{
  "printWidth": 150,
  "endOfLine": "lf"
}
```

`.prettierignore` も置きます。`pnpm format` などから `prettier --write .` を誤って実行したとき、Biome の担当ファイルまで整形されるのを防ぐためです。

```
node_modules
dist
**/*.min.css
```

ただし後述のスクリプトでは Prettier の対象を `"src/**/*.{css,scss}"` に絞るため、通常の運用で衝突は起きません。

### 2-6. スクリプトの更新

`package.json` の `scripts` のうち、次の 3 つを書き換えます。`lint:html` と `fix` は変更不要です。

```json
    "format": "biome format --write . && prettier --write \"src/**/*.{css,scss}\"",
    "lint": "biome lint --write . && stylelint \"src/**/*.{css,scss}\" --fix",
    "check": "biome check --write . && prettier --write \"src/**/*.{css,scss}\" && stylelint \"src/**/*.{css,scss}\" --fix",
```

### 2-7. Git フックの更新

ここを忘れると、フックがスタイルシートを一切検査しなくなります。

`lefthook.yml` の `pre-commit` は `biome check` にステージ済みファイルを渡していますが、2-3 で `.css` / `.scss` を除外したため、スタイルシートは素通りします。
Stylelint と Prettier のジョブを追加してください。

```yaml
pre-commit:
  jobs:
    - name: biome-check
      run: pnpm biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}
      stage_fixed: true
    # ↓ ここを追加
    - name: style-check
      glob: "*.{css,scss}"
      run: pnpm prettier --write {staged_files} && pnpm stylelint --fix {staged_files}
      stage_fixed: true
    - name: lint-html
      run: pnpm lint:html
```

`pre-push` の `pnpm lint` は 2-6 で Stylelint を含む定義に変わるため、そのままで機能します。

### 2-8. エディタ設定

`.vscode/settings.json` は既存のファイルがあります。**置き換えず、次の 3 点だけを変更してください。**

1. `[css]` の `editor.defaultFormatter` を `esbenp.prettier-vscode` に変更し、`[scss]` を同じ内容で追加する
2. `editor.codeActionsOnSave` に `"source.fixAll.stylelint": "explicit"` を追加する
3. 同じ `editor.codeActionsOnSave` から `"source.action.useSortedProperties.biome"` を削除する（2-3 で Biome 側の assist を外したため）

`css.validate` と `scss.validate` は `false` のまま残します。VS Code 内蔵の検証を有効に戻すと、Stylelint と二重に警告が出ます。

同一ファイルを Biome と Prettier の両方が整形しないよう、担当は必ず分離してください。
