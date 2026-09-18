import { z } from "zod";
import { DEVICE_TYPES, SERVICE_CATEGORIES } from "@/lib/constants";
import { moneySchema } from "@/lib/validators";

export function normalizeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const booleanFromForm = z.preprocess(
  (value) => value === true || value === "on" || value === "true",
  z.boolean(),
);

export const serviceInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().max(120).optional().default(""),
  category: z.enum(SERVICE_CATEGORIES),
  supportedDeviceTypes: z.array(z.enum(DEVICE_TYPES)).default([]),
  shortDescription: z.string().trim().min(10).max(240),
  description: z.string().trim().min(20).max(5000),
  basePrice: moneySchema.refine(value => value >= 10_000, "Service starting price must be at least ₦10,000"),
  estimatedDurationMinutes: z.preprocess(
    (value) => value === "" || value === undefined ? undefined : value,
    z.coerce.number().int().min(1).max(43200).optional(),
  ),
  requiresDiagnosis: booleanFromForm,
  requiresQuotationApproval: booleanFromForm,
}).transform((value) => ({ ...value, slug: normalizeSlug(value.slug || value.name) }))
  .refine((value) => value.slug.length >= 2, { message: "Slug must contain at least two letters or numbers", path: ["slug"] });

export type ServiceInput = z.infer<typeof serviceInputSchema>;
