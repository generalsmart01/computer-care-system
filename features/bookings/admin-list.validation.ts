import { z } from "zod";
import { BOOKING_STATUSES } from "@/lib/constants";
import { objectIdSchema } from "@/lib/validators";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
export const adminBookingQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  status: z.union([z.enum(BOOKING_STATUSES), z.literal("")]).default(""),
  serviceId: z.union([objectIdSchema, z.literal("")]).default(""),
  dateFrom: z.union([dateOnly, z.literal("")]).default(""),
  dateTo: z.union([dateOnly, z.literal("")]).default(""),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).refine(value => !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo, {
  message: "The end date must be on or after the start date", path: ["dateTo"],
});

export type AdminBookingQuery = z.infer<typeof adminBookingQuerySchema>;

export function escapeSearch(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildAdminBookingFilter(query: AdminBookingQuery) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.serviceId) filter.serviceIds = query.serviceId;
  if (query.search) {
    const safe = escapeSearch(query.search);
    filter.$or = [{ reference: { $regex: safe, $options: "i" } }, { problemTitle: { $regex: safe, $options: "i" } }];
  }
  if (query.dateFrom || query.dateTo) {
    const range: Record<string, Date> = {};
    if (query.dateFrom) range.$gte = new Date(`${query.dateFrom}T00:00:00.000Z`);
    if (query.dateTo) range.$lte = new Date(`${query.dateTo}T23:59:59.999Z`);
    filter.preferredDate = range;
  }
  return filter;
}
