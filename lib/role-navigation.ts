import type { UserRole } from "@/lib/constants";
export function dashboardForRole(role: UserRole) {
  return role === "ADMIN" || role === "SUPER_ADMIN"
    ? "/admin"
    : role === "TECHNICIAN"
      ? "/technician"
      : "/dashboard";
}
export function canAccessRole(actual: UserRole, allowed: readonly UserRole[]) {
  return (
    allowed.includes(actual) ||
    (actual === "SUPER_ADMIN" && allowed.includes("ADMIN"))
  );
}
