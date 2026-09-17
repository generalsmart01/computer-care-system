import { requireTechnician } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import { Assignment } from "@/models/Assignment";
import Link from "next/link";
import {
  PageHeader,
  StatusBadge,
  EmptyState,
} from "@/components/ui/dashboard-ui";
import { shortDate } from "@/lib/presentation";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireTechnician(),
    filter = (await searchParams).status;
  await connectDB();
  const query: any = {
    technicianId: user.id,
    status:
      filter === "COMPLETED" ? "COMPLETED" : { $in: ["ACTIVE", "COMPLETED"] },
  };
  const jobs = await Assignment.find(query)
    .select("bookingId status assignedAt acceptedAt endedAt")
    .populate({
      path: "bookingId",
      select: "reference status problemTitle preferredDate serviceMethod",
    })
    .sort({ assignedAt: -1 })
    .limit(100)
    .lean();
  return (
    <>
      <PageHeader
        eyebrow="Work management"
        title={filter === "COMPLETED" ? "Completed jobs" : "Assigned jobs"}
        description={
          filter === "COMPLETED"
            ? "Your completed assignment history."
            : "Prioritized repair assignments and their current workflow state."
        }
      />
      <div className="filter-tabs">
        <Link
          className={!filter ? "active" : undefined}
          href="/technician/jobs"
        >
          All assignments
        </Link>
        <Link
          className={filter === "COMPLETED" ? "active" : undefined}
          href="/technician/jobs?status=COMPLETED"
        >
          Completed
        </Link>
      </div>
      {jobs.length ? (
        <div className="panel booking-list">
          {jobs.map((assignment: any) => {
            const booking = assignment.bookingId;
            return (
              <Link
                className="booking-row technician-job-row"
                href={`/technician/jobs/${booking?._id}`}
                key={String(assignment._id)}
              >
                <div className="booking-reference">
                  <small>{booking?.reference || "Missing booking"}</small>
                  <strong>
                    {booking?.problemTitle || "Booking unavailable"}
                  </strong>
                </div>
                <div>
                  <small>Assigned</small>
                  <span>{shortDate(assignment.assignedAt)}</span>
                </div>
                <div>
                  <small>Acceptance</small>
                  <span>
                    {assignment.status === "COMPLETED"
                      ? "Completed"
                      : assignment.acceptedAt
                        ? "Accepted"
                        : "Action required"}
                  </span>
                </div>
                {booking?.status ? (
                  <StatusBadge value={booking.status} />
                ) : (
                  <StatusBadge value={assignment.status} />
                )}
                <span className="row-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={
            filter === "COMPLETED" ? "No completed jobs" : "No assignments"
          }
          message={
            filter === "COMPLETED"
              ? "Completed repairs will be retained here."
              : "You do not have any assigned work yet."
          }
        />
      )}
    </>
  );
}
