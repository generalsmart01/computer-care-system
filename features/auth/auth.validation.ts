import { z } from "zod";
import { emailSchema, passwordSchema, phoneSchema } from "@/lib/validators";
export const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  password: passwordSchema,
});
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1).max(128),
  })
  .superRefine((value, context) => {
    if (value.newPassword !== value.confirmPassword)
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "New password confirmation does not match",
      });
    if (value.currentPassword === value.newPassword)
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "New password must be different from the current password",
      });
  });
export const technicianPasswordSetupSchema = z
  .object({
    token: z.string().min(20).max(200),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1).max(128),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "New password confirmation does not match",
  });
