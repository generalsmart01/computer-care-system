import { z } from "zod";
import { TECHNICIAN_AVAILABILITY, USER_STATUSES } from "@/lib/constants";
import { emailSchema, phoneSchema } from "@/lib/validators";

const optionalNumber = (maximum: number) =>
  z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.coerce.number().int().min(0).max(maximum).optional(),
  );
const specializations = z.preprocess(
  (value) =>
    typeof value === "string"
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : value,
  z.array(z.string().min(2).max(80)).min(1).max(20),
);

export const createTechnicianSchema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  email: emailSchema,
  phone: z.union([phoneSchema, z.literal("")]).optional(),
  employeeNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9-]+$/),
  specializations,
  yearsOfExperience: optionalNumber(80),
  availabilityStatus: z.enum(TECHNICIAN_AVAILABILITY),
  maximumActiveJobs: z.coerce.number().int().min(1).max(100),
  bio: z.string().trim().max(2000).optional(),
});

export const updateTechnicianSchema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  phone: z.union([phoneSchema, z.literal("")]).optional(),
  employeeNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9-]+$/),
  specializations,
  yearsOfExperience: optionalNumber(80),
  availabilityStatus: z.enum(TECHNICIAN_AVAILABILITY),
  maximumActiveJobs: z.coerce.number().int().min(1).max(100),
  bio: z.string().trim().max(2000).optional(),
  status: z
    .enum(USER_STATUSES)
    .refine(
      (status) => status !== "DEACTIVATED",
      "Use ACTIVE or SUSPENDED for technician management",
    ),
});
