"use client";
import { useActionState } from "react";
import {
  administratorOnboardingAction,
  type ActionState,
} from "@/features/auth/auth.actions";
import { PasswordInput } from "./password-input";

export function AdministratorOnboardingForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    administratorOnboardingAction,
    {} as ActionState,
  );
  return (
    <form action={action} className="form onboarding-form">
      <input type="hidden" name="token" value={token} />
      <label>
        Create new password
        <PasswordInput
          name="newPassword"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
        />
        <small>Use uppercase, lowercase, and at least one number.</small>
      </label>
      <label>
        Confirm new password
        <PasswordInput
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
        />
      </label>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn" disabled={pending}>
        {pending ? "Completing setup…" : "Complete account setup"}
      </button>
    </form>
  );
}
