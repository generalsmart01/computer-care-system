"use client";

import { useActionState } from "react";
import {
  updateMyAvailability,
  type AvailabilityState,
} from "@/features/technicians/availability.actions";

export function TechnicianAvailabilityForm({ current }: { current: string }) {
  const [state, action, pending] = useActionState(
    updateMyAvailability,
    {} as AvailabilityState,
  );
  return <form action={action} className="technician-availability-form">
    <label htmlFor="availabilityStatus">My availability</label>
    <p>Set whether you can receive new assignments. Existing jobs remain yours.</p>
    <div className="technician-availability-controls">
      <select id="availabilityStatus" name="availabilityStatus" defaultValue={current}>
        <option value="AVAILABLE">Available — accept new jobs</option>
        <option value="BUSY">Busy — pause new jobs</option>
        <option value="OFF_DUTY">Off duty — not working</option>
      </select>
      <button className="btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Update availability"}</button>
    </div>
    {state.error && <p className="error" role="alert">{state.error}</p>}
    {state.success && <p className="success" role="status">{state.success}</p>}
  </form>;
}
