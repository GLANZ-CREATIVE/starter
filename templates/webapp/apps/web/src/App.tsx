import { greetingInput } from "@repo/core";
import { Button } from "@repo/ui";
import { type FormEvent, useState } from "react";

import { api } from "./api.ts";

export function App() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = greetingInput.safeParse({ name: new FormData(event.currentTarget).get("name") });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "入力を確認してください");
      return;
    }
    setError("");
    const res = await api.greetings.$post({ json: parsed.data });
    if (!res.ok) {
      setError("送信に失敗しました");
      return;
    }
    setMessage((await res.json()).message);
  }

  return (
    <main>
      <h1>webapp</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label>
          名前
          <input name="name" aria-invalid={error !== ""} aria-describedby="name-error" />
        </label>
        <Button type="submit">送信</Button>
        <p id="name-error" role="alert">
          {error}
        </p>
      </form>
      <output>{message}</output>
    </main>
  );
}
