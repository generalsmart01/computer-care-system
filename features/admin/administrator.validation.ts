import { z } from "zod";
import { emailSchema, phoneSchema } from "@/lib/validators";

export const createAdministratorSchema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  email: emailSchema,
  phone: z.union([phoneSchema, z.literal("")]).optional(),
});
