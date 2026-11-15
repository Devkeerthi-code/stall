"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field } from "@/components/Field";
import { SubmitButton } from "@/components/SubmitButton";
import { loginAction, signupAction, type AuthState } from "./actions";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(mode === "login" ? loginAction : signupAction, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="stack" noValidate>
      {e.form && <p className="form-error" role="alert">{e.form}</p>}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={state.email} error={e.email} />
      <Field
        label="Password" name="password" type="password" required
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        hint={mode === "signup" ? "At least 8 characters." : undefined} error={e.password}
      />
      <SubmitButton className="btn btn--block" pendingText={mode === "login" ? "Signing in…" : "Creating your stall…"}>
        {mode === "login" ? "Sign in" : "Create my stall"}
      </SubmitButton>
      <p className="small muted">
        {mode === "login"
          ? <>New here? <Link className="link" href="/signup">Open a free stall</Link></>
          : <>Already have a stall? <Link className="link" href="/login">Sign in</Link></>}
      </p>
    </form>
  );
}
