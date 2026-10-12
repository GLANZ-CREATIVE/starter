---
paths:
  - "src/styles/**/*.css"
  - "**/*.astro"
---

# スタイリングルール

- カラー等のトークンは `:root` の CSS 変数で定義し `var(--…)` で参照。新色は既存命名に揃える
- `style=""` 禁止。スタイルはクラス経由で `<style>`（scoped）かグローバル CSS に
- プロパティ順は `stylelint-config-recess-order` に従う
- フォーカスリングを消さない。消すなら代替の視覚表現を用意
