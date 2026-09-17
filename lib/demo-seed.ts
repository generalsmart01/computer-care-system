import {
  SERVICE_CATEGORIES,
  type BookingStatus,
  type UserRole,
} from "@/lib/constants";
import { passwordSchema } from "@/lib/validators";

type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const DEMO_SERVICES: ReadonlyArray<
  readonly [string, string, ServiceCategory, number]
> = [
  ["Laptop Repair", "laptop-repair", "HARDWARE_REPAIR", 25000],
  [
    "Hardware Diagnostics",
    "hardware-diagnostics",
    "HARDWARE_DIAGNOSTICS",
    10000,
  ],
  [
    "Software Installation",
    "software-installation",
    "SOFTWARE_INSTALLATION",
    15000,
  ],
  ["Virus and Malware Removal", "virus-removal", "VIRUS_REMOVAL", 18000],
  ["System Upgrade", "system-upgrade", "SYSTEM_UPGRADE", 30000],
  ["Data Recovery", "data-recovery", "DATA_RECOVERY", 50000],
  [
    "Preventive Maintenance",
    "preventive-maintenance",
    "PREVENTIVE_MAINTENANCE",
    12000,
  ],
  ["Remote Technical Support", "remote-support", "OTHER", 10000],
];

export const DEMO_USERS: ReadonlyArray<{
  email: string;
  legacyEmail: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}> = [
  {
    email: "chiamaka.okafor@smartnova.ng",
    legacyEmail: "admin0@example.test",
    firstName: "Chiamaka",
    lastName: "Okafor",
    role: "ADMIN",
  },
  {
    email: "tunde.adebayo@smartnova.ng",
    legacyEmail: "technician1@example.test",
    firstName: "Tunde",
    lastName: "Adebayo",
    role: "TECHNICIAN",
  },
  {
    email: "ngozi.eze@smartnova.ng",
    legacyEmail: "technician2@example.test",
    firstName: "Ngozi",
    lastName: "Eze",
    role: "TECHNICIAN",
  },
  {
    email: "ibrahim.musa@smartnova.ng",
    legacyEmail: "technician3@example.test",
    firstName: "Ibrahim",
    lastName: "Musa",
    role: "TECHNICIAN",
  },
  {
    email: "aisha.bello@smartnova.ng",
    legacyEmail: "customer4@example.test",
    firstName: "Aisha",
    lastName: "Bello",
    role: "CUSTOMER",
  },
  {
    email: "chinedu.nwosu@smartnova.ng",
    legacyEmail: "customer5@example.test",
    firstName: "Chinedu",
    lastName: "Nwosu",
    role: "CUSTOMER",
  },
  {
    email: "yetunde.adeyemi@smartnova.ng",
    legacyEmail: "customer6@example.test",
    firstName: "Yetunde",
    lastName: "Adeyemi",
    role: "CUSTOMER",
  },
  {
    email: "emeka.obi@smartnova.ng",
    legacyEmail: "customer7@example.test",
    firstName: "Emeka",
    lastName: "Obi",
    role: "CUSTOMER",
  },
  {
    email: "zainab.lawal@smartnova.ng",
    legacyEmail: "customer8@example.test",
    firstName: "Zainab",
    lastName: "Lawal",
    role: "CUSTOMER",
  },
];

export const PRIMARY_DEMO_ACCOUNTS = {
  ADMIN: "chiamaka.okafor@smartnova.ng",
  TECHNICIAN: "tunde.adebayo@smartnova.ng",
  CUSTOMER: "aisha.bello@smartnova.ng",
} as const satisfies Record<Exclude<UserRole, "SUPER_ADMIN">, string>;

export function validateDemoPassword(value: string) {
  const parsed = passwordSchema.safeParse(value);
  if (!parsed.success)
    throw new Error(
      "DEMO_PASSWORD must contain 8–128 characters with uppercase, lowercase, and numeric characters",
    );
  return parsed.data;
}

export const ACTIVE_DEMO_STATUSES: readonly BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "AWAITING_DEVICE",
  "RECEIVED",
  "ASSIGNED",
  "DIAGNOSING",
  "AWAITING_APPROVAL",
  "APPROVED",
  "REPAIRING",
  "QUALITY_CHECK",
];
export const TERMINAL_DEMO_STATUSES: readonly BookingStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "COMPLETED",
];

export function demoDeviceSpecs() {
  return DEMO_USERS.filter((user) => user.role === "CUSTOMER").flatMap(
    (user, customerIndex) =>
      [0, 1].map((deviceIndex) => ({
        ownerEmail: user.email,
        type: deviceIndex ? ("DESKTOP" as const) : ("LAPTOP" as const),
        brand: deviceIndex ? "Dell" : "Lenovo",
        model: deviceIndex
          ? `OptiPlex ${7000 + customerIndex}`
          : `ThinkPad T${14 + customerIndex}`,
        serialNumber: `NG-CMB-${customerIndex + 1}-${deviceIndex + 1}`,
      })),
  );
}
