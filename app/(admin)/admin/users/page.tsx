import Link from "next/link";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  adminUserQuerySchema,
  buildAdminUserFilter,
} from "@/features/admin/user-list.validation";
function pageHref(query: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, page: String(page) }))
    if (value) params.set(key, value);
  return `/admin/users?${params}`;
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams,
    parsed = adminUserQuerySchema.safeParse(raw),
    query = parsed.success ? parsed.data : adminUserQuerySchema.parse({}),
    filter = buildAdminUserFilter(query);
  await connectDB();
  const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      User.countDocuments(filter),
    ]),
    pages = Math.max(1, Math.ceil(total / query.limit));
  return (
    <>
      <h1>Users</h1>
      {!parsed.success && (
        <p className="error" role="alert">
          Invalid filters were reset.
        </p>
      )}
      <form className="card form" method="get">
        <label>
          Search name, email, or phone
          <input name="search" maxLength={100} defaultValue={query.search} />
        </label>
        <label>
          Role
          <select name="role" defaultValue={query.role || ""}>
            <option value="">All roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="TECHNICIAN">Technician</option>
            <option value="ADMIN">Administrator</option>
            <option value="SUPER_ADMIN">Super administrator</option>
          </select>
        </label>
        <label>
          Status
          <select name="status" defaultValue={query.status || ""}>
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </label>
        <input type="hidden" name="limit" value={query.limit} />
        <button className="btn">Apply filters</button>
      </form>
      <p>
        {total} matching account{total === 1 ? "" : "s"}.
      </p>
      {users.length ? (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Account</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={String(user._id)}>
                <td>
                  {user.firstName} {user.lastName}
                </td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className="status">{user.status}</span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <Link
                    className="btn secondary"
                    href={`/admin/users/${user._id}`}
                  >
                    View account
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="card">No users match these filters.</p>
      )}
      <nav aria-label="User list pagination">
        <p>
          {query.page > 1 && (
            <Link
              className="btn secondary"
              href={pageHref(raw, query.page - 1)}
            >
              Previous
            </Link>
          )}{" "}
          <span>
            Page {Math.min(query.page, pages)} of {pages}
          </span>{" "}
          {query.page < pages && (
            <Link
              className="btn secondary"
              href={pageHref(raw, query.page + 1)}
            >
              Next
            </Link>
          )}
        </p>
      </nav>
    </>
  );
}
