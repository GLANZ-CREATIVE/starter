import app from "./app.ts";

// Cloudflare Workers の入口。バインディングなど環境ごとの処理はここに置き、app.ts を実行環境に依存させない
export default app;
