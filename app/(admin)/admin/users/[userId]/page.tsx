import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Booking } from "@/models/Booking";
import { setUserStatusAction } from "@/features/admin/admin.actions";
export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const admin = await requireAdmin(),
    id = (await params).userId;
  await connectDB();
  const [userResult, bookingCount] = await Promise.all([
    User.findById(id).lean(),
    Booking.countDocuments({ customerId: id }),
  ]);
  const user: any = userResult;
  if (!user) notFound();
  const privilegedTarget = ["ADMIN", "SUPER_ADMIN"].includes(user.role),
    canManageRole =
      user.role !== "SUPER_ADMIN" &&
      (!privilegedTarget || admin.role === "SUPER_ADMIN"),
    changeable =
      canManageRole &&
      ["ACTIVE", "SUSPENDED"].includes(user.status) &&
      admin.id !== id,
    next = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  return (
    <>
      <p>
        <Link href="/admin/users">← Back to users</Link>
      </p>
      <h1>
        {user.firstName} {user.lastName}
      </h1>
      <section className="card">
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Phone:</strong> {user.phone || "Not supplied"}
        </p>
        <p>
          <strong>Role:</strong> {user.role}
        </p>
        <p>
          <strong>Status:</strong> <span className="status">{user.status}</span>
        </p>
        <p>
          <strong>Created:</strong> {new Date(user.createdAt).toLocaleString()}
        </p>
        <p>
          <strong>Last login:</strong>{" "}
          {user.lastLoginAt
            ? new Date(user.lastLoginAt).toLocaleString()
            : "Never"}
        </p>
        {user.role === "CUSTOMER" && (
          <p>
            <strong>Bookings:</strong> {bookingCount}
          </p>
        )}
      </section>
      <section className="card">
        <h2>Account access</h2>
        {changeable ? (
          <form action={setUserStatusAction.bind(null, id, next)}>
            <p>
              {next === "SUSPENDED"
                ? "Suspending blocks future logins. Existing signed sessions expire normally; server actions still validate role and account workflows."
                : "Reactivating restores credential login."}
            </p>
            <button className="btn">
              {next === "SUSPENDED" ? "Suspend account" : "Reactivate account"}
            </button>
          </form>
        ) : (
          <p>
            {admin.id === id
              ? "You cannot change your own account status."
              : !canManageRole
                ? "Only a super administrator can manage administrator accounts."
              : "Deactivated accounts cannot be reactivated from this workflow."}
          </p>
        )}
      </section>
      <section className="card">
        <h2>Password security</h2>
        <p>
          Administrators cannot view or overwrite passwords. Direct the user to
          the password-reset workflow when password recovery is available.
        </p>
        <Link className="btn secondary" href="/forgot-password">
          Open password reset
        </Link>
      </section>
    </>
  );
}
