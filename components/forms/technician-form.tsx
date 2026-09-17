"use client";
import { useActionState } from "react";
import { TECHNICIAN_AVAILABILITY } from "@/lib/constants";
import {
  createTechnicianAction,
  updateTechnicianAction,
  type TechnicianActionState,
} from "@/features/technicians/technician.actions";

type Defaults = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: "ACTIVE" | "SUSPENDED";
  employeeNumber: string;
  specializations: string[];
  yearsOfExperience?: number;
  availabilityStatus: string;
  maximumActiveJobs: number;
  bio?: string;
};
export function TechnicianForm({ technician }: { technician?: Defaults }) {
  const action = technician
    ? updateTechnicianAction.bind(null, technician.id)
    : createTechnicianAction;
  const [state, formAction, pending] = useActionState(
    action,
    {} as TechnicianActionState,
  );
  return (
    <form action={formAction} className="form">
      <div className="grid cards">
        <label>
          First name
          <input
            name="firstName"
            required
            minLength={2}
            maxLength={50}
            defaultValue={technician?.firstName}
          />
        </label>
        <label>
          Last name
          <input
            name="lastName"
            required
            minLength={2}
            maxLength={50}
            defaultValue={technician?.lastName}
          />
        </label>
      </div>
      {technician ? (
        <label>
          Email
          <input value={technician.email} disabled />
          <span className="muted">
            Use the account recovery workflow to change login credentials.
          </span>
        </label>
      ) : (
        <>
          <label>
            Email
            <input name="email" type="email" required autoComplete="off" />
            <span className="muted">
              We will email a secure, single-use invitation to this address. The
              technician will verify it and create their own password.
            </span>
          </label>
        </>
      )}
      <label>
        Phone
        <input name="phone" type="tel" defaultValue={technician?.phone} />
      </label>
      <label>
        Employee number
        <input
          name="employeeNumber"
          required
          pattern="[A-Za-z0-9-]+"
          maxLength={40}
          defaultValue={technician?.employeeNumber}
        />
      </label>
      <label>
        Specializations, comma-separated
        <input
          name="specializations"
          required
          defaultValue={technician?.specializations.join(", ")}
        />
      </label>
      <label>
        Years of experience
        <input
          name="yearsOfExperience"
          type="number"
          min="0"
          max="80"
          defaultValue={technician?.yearsOfExperience}
        />
      </label>
      <label>
        Availability
        <select
          name="availabilityStatus"
          defaultValue={technician?.availabilityStatus || "AVAILABLE"}
        >
          {TECHNICIAN_AVAILABILITY.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      <label>
        Maximum active jobs
        <input
          name="maximumActiveJobs"
          type="number"
          min="1"
          max="100"
          required
          defaultValue={technician?.maximumActiveJobs || 5}
        />
      </label>
      {technician && (
        <label>
          Account status
          <select name="status" defaultValue={technician.status}>
            <option>ACTIVE</option>
            <option>SUSPENDED</option>
          </select>
        </label>
      )}
      <label>
        Biography
        <textarea
          name="bio"
          maxLength={2000}
          rows={5}
          defaultValue={technician?.bio}
        />
      </label>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p role="status">{state.success}</p>}
      <button className="btn" disabled={pending}>
        {pending
          ? "Saving…"
          : technician
            ? "Save technician"
            : "Create technician"}
      </button>
    </form>
  );
}
