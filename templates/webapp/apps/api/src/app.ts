import { zValidator } from "@hono/zod-validator";
import { greetingInput } from "@repo/core";
import { Hono } from "hono";

const app = new Hono()
  .basePath("/api")
  .get("/health", (c) => c.json({ status: "ok" }))
  .post("/greetings", zValidator("json", greetingInput), (c) => {
    const { name } = c.req.valid("json");
    return c.json({ message: `こんにちは、${name}さん` });
  });

export type AppType = typeof app;
export default app;
