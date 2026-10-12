# カスタムブロック

`@wordpress/create-block` と `@wordpress/scripts`（公式ツールチェーン）でブロックを管理する。

## ディレクトリ構成

```
theme/blocks/
├── package.json      ← 削除禁止（下記「隔離用 package.json」参照）
├── {block-name}/     ← ソース（create-block が生成するフラット構成）
└── build/            ← ビルド成果物（.gitignore 済み、PHP が走査して自動登録）
```

## コマンド

| コマンド                 | 内容                                            |
| ------------------------ | ----------------------------------------------- |
| `pnpm blocks:new <name>` | `theme/blocks/<name>/` に公式テンプレートを生成 |
| `pnpm blocks:build`      | `theme/blocks/build/` に一括ビルド              |
| `pnpm blocks:start`      | 開発用 watch ビルド                             |

ビルドされたブロックは `theme/functions/blocks.php` が `build/*/block.json` を走査して自動登録する。
