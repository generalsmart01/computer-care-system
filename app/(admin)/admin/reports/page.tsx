import { PageHeader, StatusBadge } from "@/components/ui/dashboard-ui";
import { getAdminReports } from "@/features/reports/report.service";
import { reportQuerySchema } from "@/features/reports/report.validation";
import { humanize } from "@/lib/presentation";

type CountItem = { _id: string; count: number; name?: string };

function RankedList({ items, empty }: { items: CountItem[]; empty: string }) {
  if (!items.length) return <p className="report-empty">{empty}</p>;
  const maximum = Math.max(...items.map((item) => item.count), 1);
  return (
    <ol className="report-ranking">
      {items.map((item) => (
        <li key={String(item._id)}>
          <div>
            <span>{item.name || humanize(item._id)}</span>
            <strong>{item.count}</strong>
          </div>
          <i>
            <span style={{ width: `${(item.count / maximum) * 100}%` }} />
          </i>
        </li>
      ))}
    </ol>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>;
}) {
  const raw = await searchParams;
  const parsed = reportQuerySchema.safeParse(raw);
  const report = await getAdminReports(parsed.success ? parsed.data : {});
  const { summary } = report;
  const completionRate = summary.total
    ? Math.round((summary.completed / summary.total) * 100)
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Business intelligence"
        title="Reports and analytics"
        description="Review booking performance, service demand, turnaround time, and technician capacity."
      />
      {!parsed.success && (
        <p className="error" role="alert">
          The date range was invalid, so the report was reset.
        </p>
      )}

      <section
        className="report-filter panel"
        aria-labelledby="report-period-title"
      >
        <div>
          <span className="report-filter-icon" aria-hidden="true">
            ⌁
          </span>
          <div>
            <h2 id="report-period-title">Reporting period</h2>
            <p>Filter booking and completion results by creation date.</p>
          </div>
        </div>
        <form method="get">
          <label>
            From date
            <input
              name="dateFrom"
              type="date"
              defaultValue={report.query.dateFrom}
            />
          </label>
          <label>
            To date
            <input
              name="dateTo"
              type="date"
              defaultValue={report.query.dateTo}
            />
          </label>
          <button className="btn">Apply filter</button>
        </form>
      </section>

      <section className="report-kpis" aria-label="Report summary">
        {[
          [
            "Total bookings",
            summary.total,
            "All requests in this period",
            "teal",
          ],
          [
            "Active repairs",
            summary.activeRepairs,
            "Currently moving through repair",
            "blue",
          ],
          [
            "Completed",
            summary.completed,
            `${completionRate}% completion rate`,
            "green",
          ],
          [
            "Pending review",
            summary.pending,
            "Awaiting administrator action",
            "amber",
          ],
          [
            "Cancelled",
            summary.cancelled,
            "Requests cancelled by customers",
            "red",
          ],
          [
            "Available technicians",
            summary.availableTechnicians,
            "Ready for new assignments",
            "violet",
          ],
        ].map(([label, value, helper, tone]) => (
          <article className={`report-kpi report-kpi-${tone}`} key={label}>
            <span aria-hidden="true" />
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
              <small>{helper}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="report-insight-grid">
        <article className="panel report-chart-card report-wide">
          <header>
            <div>
              <p>Booking volume</p>
              <h2>Monthly activity</h2>
            </div>
            <span>{summary.total} total</span>
          </header>
          <RankedList
            items={report.byMonth}
            empty="No bookings were created in this period."
          />
        </article>
        <article className="panel report-chart-card">
          <header>
            <div>
              <p>Workflow</p>
              <h2>Status distribution</h2>
            </div>
          </header>
          <RankedList
            items={report.byStatus}
            empty="No booking statuses are available."
          />
        </article>
        <article className="panel report-turnaround">
          <p>Service efficiency</p>
          <h2>Average completion time</h2>
          <strong>
            {report.averageCompletionHours.toFixed(1)}
            <span> hours</span>
          </strong>
          <div>
            <span>Based on completed repairs</span>
            <b>{report.completedForAverage}</b>
          </div>
          <small>
            The average time from booking creation to customer handover.
          </small>
        </article>
        <article className="panel report-chart-card">
          <header>
            <div>
              <p>Customer demand</p>
              <h2>Most requested services</h2>
            </div>
          </header>
          <RankedList
            items={report.topServices}
            empty="No service demand was recorded in this period."
          />
        </article>
        <article className="panel report-chart-card">
          <header>
            <div>
              <p>Diagnosis trends</p>
              <h2>Common fault categories</h2>
            </div>
          </header>
          <RankedList
            items={report.faultCategories}
            empty="No submitted fault categories were recorded."
          />
        </article>
      </section>

      <section className="panel report-team-section">
        <header>
          <div>
            <p>Team operations</p>
            <h2>Technician capacity and output</h2>
          </div>
          <span>
            {report.workload.length} technician
            {report.workload.length === 1 ? "" : "s"}
          </span>
        </header>
        <div className="report-team-grid">
          <div>
            <h3>Current workload</h3>
            {report.workload.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Technician</th>
                      <th>Status</th>
                      <th>Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.workload.map((item: any) => (
                      <tr key={String(item._id)}>
                        <td>
                          <strong>{item.name}</strong>
                          <small>{item.employeeNumber}</small>
                        </td>
                        <td>
                          <StatusBadge value={item.availabilityStatus} />
                        </td>
                        <td>
                          <div className="capacity-cell">
                            <span>
                              {item.activeJobCount} / {item.maximumActiveJobs}
                            </span>
                            <i>
                              <span
                                style={{
                                  width: `${Math.min(100, (item.activeJobCount / Math.max(1, item.maximumActiveJobs)) * 100)}%`,
                                }}
                              />
                            </i>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="report-empty">
                No technician profiles are available.
              </p>
            )}
          </div>
          <div>
            <h3>Completed assignments</h3>
            {report.completedJobs.length ? (
              <ol className="completed-ranking">
                {report.completedJobs.map((item: any, index: number) => (
                  <li key={String(item._id)}>
                    <span>{index + 1}</span>
                    <strong>{item.name}</strong>
                    <b>{item.completedJobs}</b>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="report-empty">
                No technician assignments were completed in this period.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
