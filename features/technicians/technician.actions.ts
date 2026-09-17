"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireSuperAdmin } from "@/lib/permissions";
import { createTechnician, updateTechnician } from "./technician.service";

export type TechnicianActionState = { error?: string; success?: string };
export async function createTechnicianAction(
  _state: TechnicianActionState,
  form: FormData,
): Promise<TechnicianActionState> {
  const admin = await requireSuperAdmin();
  let profile;
  try {
    profile = await createTechnician(admin.id, Object.fromEntries(form));
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not create technician",
    };
  }
  revalidatePath("/admin/technicians");
  redirect(`/admin/technicians/${profile.id}`);
}
export async function updateTechnicianAction(
  profileId: string,
  _state: TechnicianActionState,
  form: FormData,
): Promise<TechnicianActionState> {
  const admin = await requireAdmin();
  try {
    await updateTechnician(admin.id, profileId, Object.fromEntries(form));
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not update technician",
    };
  }
  revalidatePath("/admin/technicians");
  revalidatePath(`/admin/technicians/${profileId}`);
  return { success: "Technician updated" };
}
