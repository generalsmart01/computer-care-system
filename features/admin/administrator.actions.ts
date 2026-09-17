"use server";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/permissions";
import { createAdministrator } from "./administrator.service";

export type AdministratorActionState = { error?: string };
export async function createAdministratorAction(
  _state: AdministratorActionState,
  form: FormData,
): Promise<AdministratorActionState> {
  const actor = await requireSuperAdmin();
  try {
    await createAdministrator(actor.id, Object.fromEntries(form));
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not create administrator",
    };
  }
  redirect("/admin/administrators?created=1");
}
