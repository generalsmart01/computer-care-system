import { z } from "zod";
import { moneySchema } from "@/lib/validators";

const listFromText = z.preprocess(value => typeof value === "string" ? value.split(",").map(item => item.trim()).filter(Boolean) : value, z.array(z.string().min(1).max(200)).max(30));
const partsFromText = z.preprocess(value => {
  if (typeof value !== "string") return value;
  return value.split("\n").map(line => line.trim()).filter(Boolean).map(line => {
    const [name, quantity, estimatedUnitPrice] = line.split("|").map(item => item.trim());
    return { name, quantity, estimatedUnitPrice: estimatedUnitPrice || undefined };
  });
}, z.array(z.object({ name: z.string().min(1).max(120), quantity: z.coerce.number().int().min(1).max(1000), estimatedUnitPrice: z.preprocess(value => value === undefined || value === "" ? undefined : value, moneySchema.optional()) })).max(50));

export const diagnosisDraftSchema = z.object({
  observedSymptoms: listFromText.default([]), faultCategory: z.string().trim().max(100).default(""),
  faultDescription: z.string().trim().max(4000).default(""), recommendedAction: z.string().trim().max(4000).default(""),
  requiredParts: partsFromText.default([]), internalNotes: z.string().trim().max(4000).default(""), customerSummary: z.string().trim().max(2000).default(""),
});

export const diagnosisSubmissionSchema = diagnosisDraftSchema.superRefine((value, context) => {
  if (!value.observedSymptoms.length) context.addIssue({code:"custom",path:["observedSymptoms"],message:"At least one observed symptom is required"});
  for (const key of ["faultCategory","faultDescription","recommendedAction","customerSummary"] as const) if (value[key].length < 3) context.addIssue({code:"custom",path:[key],message:"This field must contain at least three characters"});
});

export const diagnosisRevisionRequestSchema = z.object({ reason: z.string().trim().min(5).max(1000) });

export function formatParts(parts: Array<{name:string;quantity:number;estimatedUnitPrice?:number}>) { return parts.map(part => `${part.name} | ${part.quantity}${part.estimatedUnitPrice === undefined ? "" : ` | ${part.estimatedUnitPrice}`}`).join("\n"); }
