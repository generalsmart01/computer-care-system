import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { getEnv } from "@/lib/env";
import { BusinessRuleError } from "@/lib/errors";
import { safeFilename, validateUploads } from "./upload.validation";

type CloudinaryResponse = { secure_url?: string; error?: { message?: string } };

export async function uploadBookingImages(files: File[]) {
  const validFiles = validateUploads(files);
  if (!validFiles.length) return [];
  const env = getEnv();
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new BusinessRuleError("Image storage is not configured. Remove the images or contact support.");
  }
  const cloudName=env.CLOUDINARY_CLOUD_NAME,apiKey=env.CLOUDINARY_API_KEY,apiSecret=env.CLOUDINARY_API_SECRET;
  return Promise.all(validFiles.map(async file => {
    const timestamp = Math.floor(Date.now() / 1000);
    const base = safeFilename(file.name).replace(/\.[^.]+$/, "") || "booking-image";
    const publicId = `${base}-${randomUUID()}`;
    const folder = "computer-maintenance/bookings";
    const signature = createHash("sha1").update(`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
    const body = new FormData();
    body.set("file", file);
    body.set("api_key", apiKey);
    body.set("timestamp", String(timestamp));
    body.set("folder", folder);
    body.set("public_id", publicId);
    body.set("signature", signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, { method: "POST", body, cache: "no-store" });
    const result = await response.json() as CloudinaryResponse;
    if (!response.ok || !result.secure_url) throw new BusinessRuleError(result.error?.message || "An image could not be uploaded");
    return result.secure_url;
  }));
}
