import { z } from "zod";

export const greetingInput = z.object({
  name: z.string().trim().min(1, "名前を入力してください").max(50, "名前は 50 文字以内で入力してください"),
});

export type GreetingInput = z.infer<typeof greetingInput>;
