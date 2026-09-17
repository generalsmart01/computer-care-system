"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCustomer } from "@/lib/permissions";
import { uploadBookingImages } from "@/features/uploads/image-upload.service";
import { createBooking, cancelBooking } from "./booking.service";

export type BookingActionState = { error?: string };

export async function createBookingAction(_state: BookingActionState, form: FormData): Promise<BookingActionState> {
  const user = await requireCustomer();
  let booking;
  try {
    const raw = Object.fromEntries(form);
    const files = form.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
    const imageUrls = await uploadBookingImages(files);
    booking = await createBooking(user.id, {
      ...raw,
      serviceIds: form.getAll("serviceIds"),
      symptoms: String(raw.symptoms || "").split(",").map(value => value.trim()).filter(Boolean),
      imageUrls,
      address: raw.serviceMethod === "WALK_IN" ? undefined : {
        line1: raw.addressLine1, line2: raw.addressLine2 || undefined, city: raw.city, state: raw.state, country: raw.country,
      },
    });
  } catch (error) { return { error: error instanceof Error ? error.message : "Could not create booking" }; }
  redirect(`/dashboard/bookings/${booking.id}`);
}

export async function cancelBookingAction(id: string, form: FormData) {
  const user = await requireCustomer();
  await cancelBooking(user.id, id, String(form.get("reason") || ""));
  revalidatePath(`/dashboard/bookings/${id}`);
}
