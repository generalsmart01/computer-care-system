export const USER_ROLES = [
  "CUSTOMER",
  "TECHNICIAN",
  "ADMIN",
  "SUPER_ADMIN",
] as const;
export const USER_STATUSES = ["ACTIVE", "SUSPENDED", "DEACTIVATED"] as const;
export const BOOKING_STATUSES = [
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
  "READY_FOR_COLLECTION",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
] as const;
export const DEVICE_TYPES = ["LAPTOP", "DESKTOP", "TABLET", "PHONE", "OTHER"] as const;
export const SERVICE_CATEGORIES = [
  "HARDWARE_REPAIR",
  "HARDWARE_DIAGNOSTICS",
  "SOFTWARE_INSTALLATION",
  "VIRUS_REMOVAL",
  "SYSTEM_UPGRADE",
  "DATA_RECOVERY",
  "PREVENTIVE_MAINTENANCE",
  "OTHER",
] as const;
export const SERVICE_METHODS = ["WALK_IN", "PICKUP", "ON_SITE"] as const;
export const TECHNICIAN_AVAILABILITY = [
  "AVAILABLE",
  "BUSY",
  "OFF_DUTY",
] as const;
export const QUOTATION_STATUSES = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "REPLACED",
] as const;
export const ASSIGNMENT_STATUSES = [
  "ACTIVE",
  "REASSIGNED",
  "COMPLETED",
  "CANCELLED",
] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
