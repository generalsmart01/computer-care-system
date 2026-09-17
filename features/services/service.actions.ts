"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/permissions";
import { createService, setServiceActive, updateService } from "./service.service";

export type ServiceActionState = { error?: string };

function values(form: FormData) {
  return Object.fromEntries(form.entries());
}

export async function createServiceAction(_state: ServiceActionState, form: FormData): Promise<ServiceActionState> {
  await requireAdmin();
  let service;
  try { service = await createService(values(form)); }
  catch (error) { return { error: error instanceof Error ? error.message : "Could not create service" }; }
  revalidatePath("/services");
  revalidatePath("/admin/services");
  redirect(`/admin/services/${service.id}`);
}

export async function updateServiceAction(serviceId: string, _state: ServiceActionState, form: FormData): Promise<ServiceActionState> {
  await requireAdmin();
  try { await updateService(serviceId, values(form)); }
  catch (error) { return { error: error instanceof Error ? error.message : "Could not update service" }; }
  revalidatePath("/services");
  revalidatePath(`/admin/services/${serviceId}`);
  return {};
}

export async function setServiceActiveAction(serviceId: string, isActive: boolean) {
  await requireAdmin();
  await setServiceActive(serviceId, isActive);
  revalidatePath("/services");
  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${serviceId}`);
}
