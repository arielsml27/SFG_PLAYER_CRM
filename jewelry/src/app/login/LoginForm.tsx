"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions";
import { Field } from "@/components/ui";

export default function LoginForm() {
  const [error, formAction, pending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="stack">
      <Field label="אימייל">
        <input name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Field label="סיסמה">
        <input name="password" type="password" autoComplete="current-password" required />
      </Field>
      {error ? (
        <p className="danger" style={{ fontSize: 13 }}>
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "רגע…" : "כניסה"}
      </button>
    </form>
  );
}
