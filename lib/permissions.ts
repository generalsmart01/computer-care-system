import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionUser } from "@/lib/auth";
import { AuthenticationError, AuthorizationError } from "@/lib/errors";
import type { UserRole } from "@/lib/constants";
import { canAccessRole } from "@/lib/role-navigation";
export async function requireUser(
  redirectToLogin = false,
): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    if (redirectToLogin) redirect("/login");
    throw new AuthenticationError();
  }
  return user;
}
export async function requireRole(...roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new AuthorizationError();
  return user;
}
export async function requirePageRole(...roles: UserRole[]) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (!canAccessRole(user.role, roles)) redirect("/forbidden");
  return user;
}
export const requireCustomer = () => requireRole("CUSTOMER");
export const requireTechnician = () => requireRole("TECHNICIAN");
export const requireAdmin = () => requireRole("ADMIN", "SUPER_ADMIN");
export const requireSuperAdmin = () => requireRole("SUPER_ADMIN");
