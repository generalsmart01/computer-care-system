"use client";
import { useActionState } from "react";
import {
  createAdministratorAction,
  type AdministratorActionState,
} from "@/features/admin/administrator.actions";

export function AdministratorForm() {
  const [state, action, pending] = useActionState(
    createAdministratorAction,
    {} as AdministratorActionState,
  );
  return (
    <form action={action} className="form card">
      <label>
        First name
        <input name="firstName" required minLength={2} maxLength={50} />
      </label>
      <label>
        Last name
        <input name="lastName" required minLength={2} maxLength={50} />
      </label>
      <label>
        Email
        <input name="email" type="email" required autoComplete="off" />
        <span className="muted">
          A secure invitation will be sent here so the administrator can verify
          their email and create their own password.
        </span>
      </label>
      <label>
        Phone
        <input name="phone" type="tel" />
      </label>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn" disabled={pending}>
        {pending ? "Sending invitation…" : "Create administrator"}
      </button>
    </form>
  );
}
