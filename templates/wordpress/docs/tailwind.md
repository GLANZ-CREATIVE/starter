# Tailwind CSS を導入する

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

`vite.config.js` にプラグインを追加:

```js
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

`theme/src/assets/css/index.css`:

```css
@import "tailwindcss";
@source "../../.."; /* theme/ 配下の PHP / JS をスキャン */
```

最後に `pnpm dev` で Vite を再起動します（`pnpm add` 後は必須）。
