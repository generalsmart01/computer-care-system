"use client";
import { useActionState } from "react";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import {
  createServiceAction,
  updateServiceAction,
  type ServiceActionState,
} from "@/features/services/service.actions";

type ServiceDefaults = {
  id: string;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  estimatedDurationMinutes?: number;
  requiresDiagnosis: boolean;
  requiresQuotationApproval: boolean;
};

export function ServiceForm({ service }: { service?: ServiceDefaults }) {
  const action = service
    ? updateServiceAction.bind(null, service.id)
    : createServiceAction;
  const [state, formAction, pending] = useActionState(
    action,
    {} as ServiceActionState,
  );
  return (
    <form action={formAction} className="form">
      <label>
        Name
        <input
          name="name"
          required
          minLength={2}
          maxLength={100}
          defaultValue={service?.name}
        />
      </label>
      <label>
        Slug{" "}
        <span className="muted">Leave blank to generate from the name.</span>
        <input
          name="slug"
          pattern="[a-z0-9-]+"
          maxLength={120}
          defaultValue={service?.slug}
        />
      </label>
      <label>
        Category
        <select name="category" required defaultValue={service?.category}>
          {SERVICE_CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </label>
      <label>
        Short description
        <textarea
          name="shortDescription"
          required
          minLength={10}
          maxLength={240}
          defaultValue={service?.shortDescription}
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          required
          minLength={20}
          maxLength={5000}
          rows={7}
          defaultValue={service?.description}
        />
      </label>
      <label>
      Base price (₦)
        <input
          name="basePrice"
          type="number"
          required
          min="0"
          max="10000000"
          step="0.01"
          defaultValue={service?.basePrice}
        />
      </label>
      <label>
        Estimated duration (minutes)
        <input
          name="estimatedDurationMinutes"
          type="number"
          min="1"
          max="43200"
          defaultValue={service?.estimatedDurationMinutes}
        />
      </label>
      <label>
        <span>
          <input
            style={{ width: "auto" }}
            name="requiresDiagnosis"
            type="checkbox"
            defaultChecked={service?.requiresDiagnosis ?? true}
          />{" "}
          Requires diagnosis
        </span>
      </label>
      <label>
        <span>
          <input
            style={{ width: "auto" }}
            name="requiresQuotationApproval"
            type="checkbox"
            defaultChecked={service?.requiresQuotationApproval ?? true}
          />{" "}
          Requires quotation approval
        </span>
      </label>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn" disabled={pending}>
        {pending ? "Saving…" : service ? "Save changes" : "Create service"}
      </button>
      {!state.error && service && (
        <p aria-live="polite" className="muted">
          Changes are validated and saved on the server.
        </p>
      )}
    </form>
  );
}
