"use client";
import { useActionState } from "react";
import {
  diagnosisFormAction,
  type DiagnosisActionState,
} from "@/features/diagnoses/diagnosis.actions";
type Draft = {
  observedSymptoms?: string[];
  faultCategory?: string;
  faultDescription?: string;
  recommendedAction?: string;
  requiredParts?: string;
  internalNotes?: string;
  customerSummary?: string;
};
export function DiagnosisForm({
  bookingId,
  draft,
  revision,
}: {
  bookingId: string;
  draft?: Draft;
  revision?: number;
}) {
  const [state, action, pending] = useActionState(
    diagnosisFormAction.bind(null, bookingId),
    {} as DiagnosisActionState,
  );
  return (
    <form action={action} className="card form">
      <h2>Diagnosis worksheet{revision ? ` — Revision ${revision}` : ""}</h2>
      <label>
        Observed symptoms, comma-separated
        <input
          name="observedSymptoms"
          defaultValue={draft?.observedSymptoms?.join(", ")}
          maxLength={3000}
        />
      </label>
      <label>
        Fault category
        <input
          name="faultCategory"
          defaultValue={draft?.faultCategory}
          maxLength={100}
        />
      </label>
      <label>
        Fault description
        <textarea
          name="faultDescription"
          defaultValue={draft?.faultDescription}
          maxLength={4000}
          rows={5}
        />
      </label>
      <label>
        Recommended action
        <textarea
          name="recommendedAction"
          defaultValue={draft?.recommendedAction}
          maxLength={4000}
          rows={5}
        />
      </label>
      <label>
        Required parts{" "}
        <span className="muted">
          One per line: name | quantity | estimated unit price (₦)
        </span>
        <textarea
          name="requiredParts"
          defaultValue={draft?.requiredParts}
          rows={5}
        />
      </label>
      <label>
        Customer summary
        <textarea
          name="customerSummary"
          defaultValue={draft?.customerSummary}
          maxLength={2000}
          rows={4}
        />
      </label>
      <label>
        Internal notes{" "}
        <span className="muted">Never visible to customers.</span>
        <textarea
          name="internalNotes"
          defaultValue={draft?.internalNotes}
          maxLength={4000}
          rows={4}
        />
      </label>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p role="status">{state.success}</p>}
      <div className="wizard-actions">
        <button
          className="btn secondary"
          name="intent"
          value="draft"
          disabled={pending}
        >
          {pending ? "Saving…" : "Save draft"}
        </button>
        <button className="btn" name="intent" value="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit diagnosis"}
        </button>
      </div>
    </form>
  );
}
