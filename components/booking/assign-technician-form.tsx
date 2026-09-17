"use client";
import { useActionState } from "react";
import {
  assignTechnicianAction,
  type AssignTechnicianState,
} from "@/features/assignments/assignment.actions";
export function AssignTechnicianForm({
  bookingId,
  technicians,
}: {
  bookingId: string;
  technicians: Array<{ id: string; label: string }>;
}) {
  const [state, action, pending] = useActionState(
    assignTechnicianAction.bind(null, bookingId),
    {} as AssignTechnicianState,
  );
  return (
    <form action={action} className="card form">
      <h2>Assign technician</h2>
      {technicians.length ? (
        <>
          <label>
            Available technician
            <select name="technicianId" required defaultValue="">
              <option value="" disabled>
                Select technician
              </option>
              {technicians.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          {state.error && (
            <p className="error" role="alert">
              {state.error}
            </p>
          )}
          {state.success && <p role="status">{state.success}</p>}
          <button className="btn" disabled={pending || Boolean(state.success)}>
            {pending
              ? "Assigning…"
              : state.success
                ? "Technician assigned"
                : "Assign technician"}
          </button>
        </>
      ) : (
        <p>No available technicians are within their workload limit.</p>
      )}
    </form>
  );
}
