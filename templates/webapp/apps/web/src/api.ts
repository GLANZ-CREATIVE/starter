import type { AppType } from "@repo/api";
import { hc } from "hono/client";

export const api = hc<AppType>("/").api;
