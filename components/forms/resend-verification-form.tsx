"use client";
import { useActionState } from "react";
import {
  resendVerificationAction,
  type ActionState,
} from "@/features/auth/auth.actions";

export function ResendVerificationForm({
  defaultEmail = "",
}: {
  defaultEmail?: string;
}) {
  const [state, action, pending] = useActionState(
    resendVerificationAction,
    {} as ActionState & { success?: string },
  );
  return (
    <form action={action} className="form verification-resend">
      <label>
        Email address
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={defaultEmail}
        />
      </label>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="success" role="status">
          {state.success}
        </p>
      )}
      <button className="btn secondary" disabled={pending}>
        {pending ? "Sending…" : "Send another verification email"}
      </button>
    </form>
  );
}
