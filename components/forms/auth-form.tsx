"use client";
import { useActionState } from "react";
import {
  loginAction,
  registerAction,
  type ActionState,
} from "@/features/auth/auth.actions";
import { PasswordInput } from "./password-input";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(
    action,
    {} as ActionState,
  );
  return (
    <form action={formAction} className="form auth-form">
      {mode === "register" && (
        <>
          <div className="auth-name-grid">
            <label>
              First name
              <input
                name="firstName"
                autoComplete="given-name"
                required
                minLength={2}
                maxLength={50}
                placeholder="Your first name"
              />
            </label>
            <label>
              Last name
              <input
                name="lastName"
                autoComplete="family-name"
                required
                minLength={2}
                maxLength={50}
                placeholder="Your last name"
              />
            </label>
          </div>
          <label>
            Phone <span className="auth-optional">Optional</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Your contact number"
            />
          </label>
        </>
      )}
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </label>
      <label>
        Password
        <PasswordInput
          name="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
          maxLength={128}
          placeholder={
            mode === "login"
              ? "Enter your password"
              : "Create a strong password"
          }
        />
        {mode === "register" && (
          <small>
            Use 8–128 characters with uppercase, lowercase, and a number.
          </small>
        )}
      </label>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn auth-submit" disabled={pending}>
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Log in"
            : "Create account"}
      </button>
    </form>
  );
}
