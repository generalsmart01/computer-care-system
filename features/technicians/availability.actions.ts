"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTechnician } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import { TECHNICIAN_AVAILABILITY } from "@/lib/constants";
import { TechnicianProfile } from "@/models/TechnicianProfile";
import { AuditLog } from "@/models/AuditLog";

const availabilitySchema = z.enum(TECHNICIAN_AVAILABILITY);
export type AvailabilityState = { error?: string; success?: string };

export async function updateMyAvailability(
  _state: AvailabilityState,
  form: FormData,
): Promise<AvailabilityState> {
  const user = await requireTechnician();
  const parsed = availabilitySchema.safeParse(form.get("availabilityStatus"));
  if (!parsed.success) return { error: "Choose a valid availability status." };

  try {
    await connectDB();
    const profile = await TechnicianProfile.findOneAndUpdate(
      { userId: user.id },
      { $set: { availabilityStatus: parsed.data } },
      { new: true },
    );
    if (!profile) return { error: "Technician profile not found." };
    try {
      await AuditLog.create({
        actorId: user.id,
        action: "UPDATE_AVAILABILITY",
        entityType: "TechnicianProfile",
        entityId: profile._id,
        summary: { availabilityStatus: parsed.data },
      });
    } catch (auditError) {
      console.error("Availability changed but audit logging failed", auditError);
    }
  } catch {
    return { error: "Could not update availability. Please try again." };
  }

  revalidatePath("/technician");
  revalidatePath("/technician/profile");
  revalidatePath("/admin/technicians");
  return { success: `Availability set to ${parsed.data.toLowerCase().replace("_", " ")}.` };
}
