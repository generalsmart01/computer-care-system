import Link from "next/link";
import { connectDB } from "@/lib/db";
import { TechnicianProfile } from "@/models/TechnicianProfile";
import {
  PageHeader,
  StatusBadge,
  EmptyState,
} from "@/components/ui/dashboard-ui";
import { requireAdmin } from "@/lib/permissions";

export default async function Page() {
  const actor = await requireAdmin();
  await connectDB();
  const list = await TechnicianProfile.find()
    .populate("userId")
    .sort({ employeeNumber: 1 })
    .lean();
  const canCreate = actor.role === "SUPER_ADMIN";
  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Technicians"
        description="Monitor availability, specialties, and active workload."
        actionHref={canCreate ? "/admin/technicians/new" : undefined}
        actionLabel={canCreate ? "Create technician" : undefined}
      />
      {!list.length && (
        <EmptyState
          title="No technicians"
          message="A super administrator can create a technician account to begin assigning repairs."
          actionHref={canCreate ? "/admin/technicians/new" : undefined}
          actionLabel={canCreate ? "Create technician" : undefined}
        />
      )}
      <div className="technician-grid">
        {list.map((profile: any) => {
          const name =
              `${profile.userId?.firstName || ""} ${profile.userId?.lastName || ""}`.trim(),
            initials = name
              .split(/\s+/)
              .map((x: string) => x[0])
              .join("")
              .slice(0, 2);
          return (
            <Link
              className="panel technician-card"
              href={`/admin/technicians/${profile._id}`}
              key={String(profile._id)}
            >
              <div className="technician-card-head">
                <span className="profile-avatar small">{initials}</span>
                <span>
                  <strong>{name || "Unavailable user"}</strong>
                  <small>{profile.employeeNumber}</small>
                </span>
                <StatusBadge value={profile.availabilityStatus} />
              </div>
              <p>
                {profile.specializations?.length
                  ? profile.specializations.join(" · ")
                  : "No specializations added"}
              </p>
              <div className="capacity-track">
                <span
                  style={{
                    width: `${Math.min(100, (profile.activeJobCount / Math.max(1, profile.maximumActiveJobs)) * 100)}%`,
                  }}
                />
              </div>
              <footer>
                <span>
                  {profile.activeJobCount}/{profile.maximumActiveJobs} active
                  jobs
                </span>
                <span>View profile →</span>
              </footer>
            </Link>
          );
        })}
      </div>
    </>
  );
}
