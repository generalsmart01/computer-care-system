"use client";
import { useActionState } from "react";
import { PasswordInput } from "./password-input";
import {
  changePasswordAction,
  type ActionState,
} from "@/features/auth/auth.actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(
    changePasswordAction,
    {} as ActionState,
  );
  return (
    <form action={action} className="form change-password-form">
      <div className="security-form-heading">
        <span aria-hidden="true">◆</span>
        <div>
          <h2>Change password</h2>
          <p>Enter your current password before choosing a new one.</p>
        </div>
      </div>
      <label>
        Current password
        <PasswordInput
          name="currentPassword"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </label>
      <label>
        New password
        <PasswordInput
          name="newPassword"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
        />
        <small>
          Use 8–128 characters with uppercase, lowercase, and a number.
        </small>
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
        {pending ? "Changing password…" : "Change password"}
      </button>
      <small className="security-signout-note">
        You will be signed out after your password is changed.
      </small>
    </form>
  );
}
