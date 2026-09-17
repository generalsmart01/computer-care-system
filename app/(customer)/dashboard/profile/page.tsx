import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { PageHeader, StatusBadge } from "@/components/ui/dashboard-ui";
import { connectDB } from "@/lib/db";
import { shortDate } from "@/lib/presentation";
import { requireCustomer } from "@/lib/permissions";
import { User } from "@/models/User";

export default async function Page() {
  const session = await requireCustomer();
  await connectDB();
  const user: any = await User.findById(session.id)
    .select(
      "firstName lastName email phone status emailVerifiedAt passwordChangedAt createdAt lastLoginAt",
    )
    .lean();
  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();
  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Profile and security"
        description="Review your account details and manage sign-in security."
      />
      <div className="profile-security-grid">
        <section className="profile-card panel">
          <div className="profile-hero">
            <span className="profile-avatar">{initials}</span>
            <div>
              <h2>{session.name}</h2>
              <p>{session.email}</p>
              <StatusBadge value={user?.status || "ACTIVE"} />
            </div>
          </div>
          <dl className="detail-grid">
            <div>
              <dt>Full name</dt>
              <dd>{session.name}</dd>
            </div>
            <div>
              <dt>Email address</dt>
              <dd>{session.email}</dd>
            </div>
            <div>
              <dt>Email verification</dt>
              <dd>
                {user?.emailVerifiedAt
                  ? `Verified ${shortDate(user.emailVerifiedAt)}`
                  : "Not verified"}
              </dd>
            </div>
            <div>
              <dt>Phone number</dt>
              <dd>{user?.phone || "Not provided"}</dd>
            </div>
            <div>
              <dt>Customer since</dt>
              <dd>{user?.createdAt ? shortDate(user.createdAt) : "—"}</dd>
            </div>
            <div>
              <dt>Last sign in</dt>
              <dd>
                {user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : "Not recorded"}
              </dd>
            </div>
            <div>
              <dt>Password last changed</dt>
              <dd>
                {user?.passwordChangedAt
                  ? shortDate(user.passwordChangedAt)
                  : "Not recorded"}
              </dd>
            </div>
          </dl>
        </section>
        <section className="panel profile-security-panel">
          <ChangePasswordForm />
        </section>
      </div>
    </>
  );
}
