"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCustomer } from "@/lib/permissions";
import { createDevice, deactivateDevice, updateDevice } from "./device.service";

export type DeviceActionState = { error?: string; success?: string };

export async function createDeviceAction(_state: DeviceActionState, form: FormData): Promise<DeviceActionState> {
  const user = await requireCustomer();
  try { await createDevice(user.id, Object.fromEntries(form)); }
  catch (error) { return { error: error instanceof Error ? error.message : "Could not create device" }; }
  redirect("/dashboard/devices");
}

export async function updateDeviceAction(deviceId: string, _state: DeviceActionState, form: FormData): Promise<DeviceActionState> {
  const user = await requireCustomer();
  try { await updateDevice(user.id, deviceId, Object.fromEntries(form)); }
  catch (error) { return { error: error instanceof Error ? error.message : "Could not update device" }; }
  revalidatePath("/dashboard/devices");
  revalidatePath(`/dashboard/devices/${deviceId}`);
  return { success: "Device updated" };
}

export async function deactivateDeviceAction(id: string) {
  const user = await requireCustomer();
  await deactivateDevice(user.id, id);
  revalidatePath("/dashboard/devices");
}
