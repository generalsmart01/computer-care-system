"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireTechnician } from "@/lib/permissions";
import { acceptAssignment, assignTechnician } from "./assignment.service";
export type AssignmentActionState = { error?: string; success?: string };
export async function acceptAssignmentAction(
  bookingId: string,
  _state: AssignmentActionState,
  _form: FormData,
): Promise<AssignmentActionState> {
  const technician = await requireTechnician();
  try {
    await acceptAssignment(bookingId, technician.id);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not accept assignment",
    };
  }
  revalidatePath("/technician");
  revalidatePath("/technician/jobs");
  revalidatePath(`/technician/jobs/${bookingId}`);
  return { success: "Assignment accepted" };
}
export type AssignTechnicianState = { error?: string; success?: string };
export async function assignTechnicianAction(
  bookingId: string,
  _state: AssignTechnicianState,
  form: FormData,
): Promise<AssignTechnicianState> {
  const admin = await requireAdmin();
  try {
    await assignTechnician(
      bookingId,
      String(form.get("technicianId") || ""),
      admin.id,
    );
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not assign technician",
    };
  }
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/technician/jobs");
  return { success: "Technician assigned" };
}
