---
paths:
  - "src/pages/**/*.astro"
  - "src/components/**/*.astro"
  - "src/layouts/**/*.astro"
---

# Astro ルール

- **SSG がデフォルト**。SSR は必要なページだけ明示的に
- props は `interface Props` + `Astro.props`
- `client:` の優先度: `load` → `idle` → `visible` → `media` → `only`
- `<br>` 禁止（詩・ポエム除く）。改行は `span` + `display`
- 画像は `astro:assets` の `<Image>`。動的・外部 URL は `getImage()`
- フォントは `var(--font-inter)` / `var(--font-noto-sans-jp)` を参照（`astro.config.mjs` で定義済み）
- インポートは `@/` エイリアス
- `set:html` は XSS に注意
