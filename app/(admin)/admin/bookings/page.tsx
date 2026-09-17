import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Service } from "@/models/Service";
import { BOOKING_STATUSES } from "@/lib/constants";
import { adminBookingQuerySchema, buildAdminBookingFilter } from "@/features/bookings/admin-list.validation";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui/dashboard-ui";
import { shortDate, humanize } from "@/lib/presentation";

type SearchParams = Record<string, string | string[] | undefined>;
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value || ""; }

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const parsed = adminBookingQuerySchema.safeParse({ search: one(raw.search), status: one(raw.status), serviceId: one(raw.serviceId), dateFrom: one(raw.dateFrom), dateTo: one(raw.dateTo), page: one(raw.page) || 1, limit: one(raw.limit) || 20 });
  const query = parsed.success ? parsed.data : adminBookingQuerySchema.parse({});
  const filter = buildAdminBookingFilter(query);
  await connectDB();
  const [total, services] = await Promise.all([
    Booking.countDocuments(filter),
    Service.find().select("name").sort({ name: 1 }).lean(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.min(query.page, totalPages);
  const list = await Booking.find(filter).select("reference problemTitle status preferredDate createdAt").sort({ createdAt: -1 }).skip((page - 1) * query.limit).limit(query.limit).lean();
  const href = (page: number) => { const params = new URLSearchParams(); for (const key of ["search", "status", "serviceId", "dateFrom", "dateTo", "limit"] as const) { const value = String(query[key] || ""); if (value) params.set(key, value); } params.set("page", String(page)); return `/admin/bookings?${params}`; };
  return <>
    <PageHeader eyebrow="Operations" title="Bookings" description="Search, filter, and process every customer repair request."/>
    <form className="panel filter-bar" method="get">
      <label>Search<input name="search" defaultValue={query.search} maxLength={100} placeholder="Reference or problem title"/></label>
      <label>Status<select name="status" defaultValue={query.status}><option value="">All statuses</option>{BOOKING_STATUSES.map(status => <option key={status}>{status}</option>)}</select></label>
      <label>Service<select name="serviceId" defaultValue={query.serviceId}><option value="">All services</option>{services.map((service: any) => <option value={String(service._id)} key={String(service._id)}>{service.name}</option>)}</select></label>
      <label>Appointment from<input type="date" name="dateFrom" defaultValue={query.dateFrom}/></label><label>Appointment to<input type="date" name="dateTo" defaultValue={query.dateTo}/></label>
      <label>Rows per page<select name="limit" defaultValue={String(query.limit)}><option>10</option><option>20</option><option>50</option><option>100</option></select></label>
      {parsed.success ? null : <p className="error" role="alert">{parsed.error.issues[0]?.message || "Invalid filters"}</p>}
      <div className="filter-actions"><button className="btn">Apply filters</button><Link className="btn secondary" href="/admin/bookings">Clear</Link></div>
    </form>
    <div className="list-summary" role="status"><strong>{total}</strong> matching booking{total===1?"":"s"}<span>Page {page} of {totalPages}</span></div>
    {list.length ? <div className="panel data-table"><table><thead><tr><th>Reference</th><th>Issue</th><th>Status</th><th>Appointment</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{list.map((booking: any) => <tr key={String(booking._id)}><td><Link className="table-primary" href={`/admin/bookings/${booking._id}`}>{booking.reference}</Link></td><td>{booking.problemTitle}</td><td><StatusBadge value={booking.status}/></td><td><strong>{shortDate(booking.preferredDate)}</strong><small>{humanize("appointment")}</small></td><td><Link className="table-action" href={`/admin/bookings/${booking._id}`}>Review →</Link></td></tr>)}</tbody></table></div> : <EmptyState title="No matching bookings" message="Try clearing or changing the current filters."/>}
    <nav className="wizard-actions" aria-label="Booking pagination"><span>{page > 1 && <Link className="btn secondary" href={href(page - 1)}>Previous</Link>}</span><span>{page < totalPages && <Link className="btn secondary" href={href(page + 1)}>Next</Link>}</span></nav>
  </>;
}
