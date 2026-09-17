import { z } from "zod";
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(8).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/);
export const phoneSchema = z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/);
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
export const moneySchema = z.coerce.number().finite().nonnegative().max(10_000_000);
export const futureDateSchema = z.preprocess(value=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)?new Date(`${value}T00:00:00`):value,z.coerce.date()).refine(d => d >= new Date(new Date().setHours(0,0,0,0)), "Date cannot be in the past");
export const paginationSchema = z.object({ page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
