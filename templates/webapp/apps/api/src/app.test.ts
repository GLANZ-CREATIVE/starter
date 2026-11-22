import { testClient } from "hono/testing";
import { expect, test } from "vite-plus/test";

import app from "./app.ts";

const client = testClient(app);

test("health は ok を返す", async () => {
  const res = await client.api.health.$get();
  expect(await res.json()).toEqual({ status: "ok" });
});

test("名前を送るとあいさつを返す", async () => {
  const res = await client.api.greetings.$post({ json: { name: "  山田 " } });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ message: "こんにちは、山田さん" });
});

test("名前が空なら 400 を返す", async () => {
  const res = await client.api.greetings.$post({ json: { name: " " } });
  expect(res.status).toBe(400);
});
