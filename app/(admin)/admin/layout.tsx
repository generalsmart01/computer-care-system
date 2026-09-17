import { requirePageRole } from "@/lib/permissions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole("ADMIN", "SUPER_ADMIN");
  return (
    <DashboardShell
      title="Administration"
      user={user}
      items={[
        ["Dashboard", "/admin", "dashboard"],
        ["Bookings", "/admin/bookings", "bookings"],
        ["Services", "/admin/services", "services"],
        ["Technicians", "/admin/technicians", "technicians"],
        ["Users", "/admin/users", "users"],
        ...(user.role === "SUPER_ADMIN"
          ? [
              ["Administrators", "/admin/administrators", "users"] as [
                string,
                string,
                string,
              ],
            ]
          : []),
        ["Reports", "/admin/reports", "reports"],
        ["Audit logs", "/admin/audit-logs", "audit"],
        ["Settings", "/admin/settings", "settings"],
      ]}
    >
      {children}
    </DashboardShell>
  );
}
