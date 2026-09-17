import { requirePageRole } from "@/lib/permissions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole("TECHNICIAN");
  await connectDB();
  const account = await User.findById(user.id)
    .select("mustChangePassword")
    .lean();
  if ((account as any)?.mustChangePassword) redirect("/onboarding/technician");
  return (
    <DashboardShell
      title="Technician"
      user={user}
      items={[
        ["Dashboard", "/technician", "dashboard"],
        ["Assigned jobs", "/technician/jobs", "bookings"],
        ["Completed jobs", "/technician/jobs?status=COMPLETED", "audit"],
        ["Profile", "/technician/profile", "profile"],
      ]}
    >
      {children}
    </DashboardShell>
  );
}
