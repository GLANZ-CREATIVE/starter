import type { ComponentProps } from "react";

// type を省くとフォーム内で意図せず送信ボタンになるので、既定を button にする
export function Button({ type = "button", ...props }: ComponentProps<"button">) {
  return <button type={type} {...props} />;
}
