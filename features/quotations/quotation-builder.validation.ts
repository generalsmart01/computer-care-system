import { z } from "zod";
import { quotationInputSchema } from "./calculation";

export const quotationBuilderSchema = quotationInputSchema.extend({
  diagnosisId: z.string().regex(/^[a-f\d]{24}$/i),
  validUntil: z.coerce.date().refine(date => date > new Date(), "Quotation validity must be in the future"),
});

export function parseQuotationItems(value: string) {
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { throw new Error("Quotation items are invalid"); }
  return parsed;
}
