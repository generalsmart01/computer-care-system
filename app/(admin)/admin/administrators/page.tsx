import { requireSuperAdmin } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  PageHeader,
  EmptyState,
  StatusBadge,
} from "@/components/ui/dashboard-ui";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  await requireSuperAdmin();
  await connectDB();
  const administrators: any[] = await User.find({
    role: { $in: ["ADMIN", "SUPER_ADMIN"] },
  })
    .select("firstName lastName email role status emailVerifiedAt createdAt")
    .sort({ createdAt: -1 })
    .lean();
  const created = (await searchParams).created === "1";
  return (
    <>
      <PageHeader
        eyebrow="Access control"
        title="Administrators"
        description="Super administrators can invite administrators without sharing passwords."
        actionHref="/admin/administrators/new"
        actionLabel="Create administrator"
      />
      {created && (
        <p role="status" className="success">
          Administrator created and invitation email sent.
        </p>
      )}
      {administrators.length ? (
        <section className="panel">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verification</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {administrators.map((admin) => (
                <tr key={String(admin._id)}>
                  <td>
                    {admin.firstName} {admin.lastName}
                  </td>
                  <td>{admin.email}</td>
                  <td>
                    {admin.role === "SUPER_ADMIN"
                      ? "Super administrator"
                      : "Administrator"}
                  </td>
                  <td>
                    {admin.emailVerifiedAt ? "Verified" : "Invitation pending"}
                  </td>
                  <td>
                    <StatusBadge value={admin.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <EmptyState
          title="No administrators"
          message="Create an administrator to delegate operational management."
          actionHref="/admin/administrators/new"
          actionLabel="Create administrator"
        />
      )}
    </>
  );
}
