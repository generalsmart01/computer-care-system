import { requirePageRole } from "@/lib/permissions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole("CUSTOMER");
  return (
    <DashboardShell
      title="Customer"
      user={user}
      items={[
        ["Dashboard", "/dashboard", "dashboard"],
        ["Bookings", "/dashboard/bookings", "bookings"],
        ["New booking", "/dashboard/bookings/new", "add"],
        ["Devices", "/dashboard/devices", "devices"],
        ["Notifications", "/dashboard/notifications", "notifications"],
        ["Profile", "/dashboard/profile", "profile"],
      ]}
    >
      {children}
    </DashboardShell>
  );
}
