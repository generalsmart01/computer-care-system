const labels: Record<string, string> = {
  AWAITING_DEVICE: "Awaiting device", AWAITING_APPROVAL: "Awaiting approval",
  QUALITY_CHECK: "Quality check", READY_FOR_COLLECTION: "Ready for collection",
  OFF_DUTY: "Off duty", HARDWARE_REPAIR: "Hardware repair",
  HARDWARE_DIAGNOSTICS: "Hardware diagnostics", SOFTWARE_INSTALLATION: "Software installation",
  VIRUS_REMOVAL: "Virus removal", SYSTEM_UPGRADE: "System upgrade",
  DATA_RECOVERY: "Data recovery", PREVENTIVE_MAINTENANCE: "Preventive maintenance",
};
export function humanize(value: string) { return labels[value] || value.toLowerCase().replaceAll("_", " ").replace(/^./, letter => letter.toUpperCase()); }
export function statusTone(value: string) {
  if (["COMPLETED", "APPROVED", "ACTIVE", "AVAILABLE", "READY_FOR_COLLECTION"].includes(value)) return "success";
  if (["CANCELLED", "REJECTED", "SUSPENDED", "DEACTIVATED", "FAILED"].includes(value)) return "danger";
  if (["PENDING", "AWAITING_DEVICE", "AWAITING_APPROVAL", "QUALITY_CHECK"].includes(value)) return "warning";
  return "info";
}
export function shortDate(value: Date | string) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }
export function formatCurrency(value: number | string | null | undefined) { return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0)); }
export const ACTIVE_BOOKING_STATUSES = ["CONFIRMED", "AWAITING_DEVICE", "RECEIVED", "ASSIGNED", "DIAGNOSING", "AWAITING_APPROVAL", "APPROVED", "REPAIRING", "QUALITY_CHECK", "READY_FOR_COLLECTION"];
