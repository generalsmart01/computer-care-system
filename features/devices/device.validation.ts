import { z } from "zod";
import { DEVICE_TYPES } from "@/lib/constants";

const optionalText = (maximum: number) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(maximum).optional(),
);

export const deviceSchema = z.object({
  type: z.enum(DEVICE_TYPES),
  brand: z.string().trim().min(2).max(80),
  model: z.string().trim().min(1).max(100),
  serialNumber: optionalText(100),
  operatingSystem: optionalText(100),
  processor: optionalText(100),
  ram: optionalText(40),
  storage: optionalText(40),
  colour: optionalText(40),
  notes: optionalText(1000),
});

export type DeviceInput = z.infer<typeof deviceSchema>;
