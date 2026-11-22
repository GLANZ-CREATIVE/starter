// ローカル開発用の入口。デプロイ先が決まったら、その環境の入口に置き換える（app.ts はそのまま使える）
import { serve } from "@hono/node-server";

import app from "./app.ts";

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API: http://localhost:${info.port}/api`);
});
