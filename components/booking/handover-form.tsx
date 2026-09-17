"use client";
import { useActionState } from "react";
import {
  completeHandoverAction,
  type HandoverState,
} from "@/features/repairs/handover.actions";
export function HandoverForm({
  bookingId,
  suggestedAmount,
}: {
  bookingId: string;
  suggestedAmount: number;
}) {
  const [state, action, pending] = useActionState(
    completeHandoverAction.bind(null, bookingId),
    {} as HandoverState,
  );
  return (
    <form action={action} className="card form">
      <h2>Confirm device handover</h2>
      <p>
        This is the terminal workflow action. Confirm only after the customer or
        their representative has received the device.
      </p>
      <label>
        Final amount (₦)
        <input
          name="finalAmount"
          type="number"
          min="0"
          max="10000000"
          step="0.01"
          required
          defaultValue={suggestedAmount}
        />
      </label>
      <label>
        Zero-charge note{" "}
        <span className="muted">Required for a free or warranty repair.</span>
        <textarea name="amountNote" maxLength={500} rows={3} />
      </label>
      <label>
        Received by
        <input
          name="recipientName"
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
        />
      </label>
      <label>
        <span>
          <input name="handoverConfirmed" type="checkbox" required /> I confirm
          the repaired device was handed over.
        </span>
      </label>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p role="status">{state.success}</p>}
      <button className="btn" disabled={pending || Boolean(state.success)}>
        {pending
          ? "Completing…"
          : state.success
            ? "Booking completed"
            : "Confirm handover and complete"}
      </button>
    </form>
  );
}
