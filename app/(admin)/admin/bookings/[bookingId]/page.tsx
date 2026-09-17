import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignTechnicianForm } from "@/components/booking/assign-technician-form";
import { DiagnosisRevisionForm } from "@/components/booking/diagnosis-revision-form";
import { HandoverForm } from "@/components/booking/handover-form";
import { QualityCheckForm } from "@/components/booking/quality-check-form";
import { QuotationBuilder } from "@/components/booking/quotation-builder";
import { StatusBadge } from "@/components/ui/dashboard-ui";
import { adminTransitionAction } from "@/features/admin/admin.actions";
import { ADMIN_BOOKING_TRANSITIONS } from "@/features/bookings/admin-transitions";
import type { BookingStatus } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { formatCurrency, humanize, shortDate } from "@/lib/presentation";
import { Assignment } from "@/models/Assignment";
import { Booking } from "@/models/Booking";
import { BookingStatusHistory } from "@/models/BookingStatusHistory";
import { Device } from "@/models/Device";
import { Diagnosis } from "@/models/Diagnosis";
import { RepairReport } from "@/models/RepairReport";
import { Service } from "@/models/Service";
import { TechnicianProfile } from "@/models/TechnicianProfile";
import { User } from "@/models/User";

const labels: Partial<Record<BookingStatus, string>> = {
  CONFIRMED: "Confirm booking",
  REJECTED: "Reject booking",
  AWAITING_DEVICE: "Mark awaiting device",
  RECEIVED: "Mark device received",
};
const progressStatuses = [
  "PENDING",
  "CONFIRMED",
  "RECEIVED",
  "ASSIGNED",
  "DIAGNOSING",
  "AWAITING_APPROVAL",
  "REPAIRING",
  "QUALITY_CHECK",
  "READY_FOR_COLLECTION",
  "COMPLETED",
];
const dateTime = (value?: Date | string) =>
  value
    ? new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not recorded";

export default async function Page({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  await connectDB();
  const id = (await params).bookingId;
  const [
    bookingResult,
    repairReportResult,
    diagnosisResult,
    history,
    assignmentResult,
  ] = await Promise.all([
    Booking.findById(id)
      .populate({
        path: "customerId",
        model: User,
        select: "firstName lastName email phone",
      })
      .populate({
        path: "deviceId",
        model: Device,
        select: "type brand model serialNumber operatingSystem",
      })
      .populate({
        path: "serviceIds",
        model: Service,
        select: "name basePrice category",
      })
      .lean(),
    RepairReport.findOne({ bookingId: id }).lean(),
    Diagnosis.findOne({
      bookingId: id,
      status: { $in: ["SUBMITTED", "APPROVED"] },
    })
      .sort({ revision: -1 })
      .lean(),
    BookingStatusHistory.find({ bookingId: id })
      .populate({
        path: "changedBy",
        model: User,
        select: "firstName lastName role",
      })
      .sort({ createdAt: -1 })
      .lean(),
    Assignment.findOne({
      bookingId: id,
      status: { $in: ["ACTIVE", "COMPLETED"] },
    })
      .populate({
        path: "technicianId",
        model: User,
        select: "firstName lastName email",
      })
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const booking: any = bookingResult,
    repairReport: any = repairReportResult,
    diagnosis: any = diagnosisResult,
    assignment: any = assignmentResult;
  if (!booking) notFound();
  const actions =
    ADMIN_BOOKING_TRANSITIONS[booking.status as BookingStatus] || [];
  const availableTechnicians: any[] =
    booking.status === "RECEIVED"
      ? await TechnicianProfile.find({
          availabilityStatus: "AVAILABLE",
          $expr: { $lt: ["$activeJobCount", "$maximumActiveJobs"] },
        })
          .populate({
            path: "userId",
            model: User,
            match: { status: "ACTIVE", role: "TECHNICIAN" },
            select: "firstName lastName",
          })
          .sort({ activeJobCount: 1 })
          .lean()
      : [];
  const currentStep = Math.max(0, progressStatuses.indexOf(booking.status));

  return (
    <>
      <Link className="back-link" href="/admin/bookings">
        ← Back to bookings
      </Link>
      <header className="admin-booking-hero">
        <div>
          <p className="eyebrow">Booking management</p>
          <h1>{booking.problemTitle}</h1>
          <p>
            {booking.reference} · Created {shortDate(booking.createdAt)}
          </p>
        </div>
        <StatusBadge value={booking.status} />
      </header>

      <section
        className="panel admin-booking-progress"
        aria-label="Booking progress"
      >
        <header>
          <strong>Repair progress</strong>
          <span>
            {booking.status === "COMPLETED"
              ? "Workflow complete"
              : `Stage ${Math.min(currentStep + 1, progressStatuses.length)} of ${progressStatuses.length}`}
          </span>
        </header>
        <div className="admin-progress-track">
          <span
            style={{
              width: `${booking.status === "COMPLETED" ? 100 : Math.max(5, (currentStep / (progressStatuses.length - 1)) * 100)}%`,
            }}
          />
        </div>
        <div className="admin-progress-labels">
          <span>Request</span>
          <span>Diagnosis</span>
          <span>Repair</span>
          <span>Handover</span>
        </div>
      </section>

      <div className="admin-booking-layout">
        <div className="admin-booking-main">
          <section className="panel admin-detail-section">
            <header>
              <span>01</span>
              <div>
                <h2>Customer request</h2>
                <p>Issue description and reported symptoms</p>
              </div>
            </header>
            <h3>{booking.problemTitle}</h3>
            <p>{booking.problemDescription}</p>
            {booking.symptoms?.length ? (
              <div className="tag-list">
                {booking.symptoms.map((item: string) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : (
              <p className="muted">No additional symptoms supplied.</p>
            )}
          </section>

          <section className="panel admin-detail-section">
            <header>
              <span>02</span>
              <div>
                <h2>Workflow activity</h2>
                <p>Complete administrative history for this booking</p>
              </div>
            </header>
            {history.length ? (
              <ol className="enhanced-timeline">
                {history.map((item: any) => (
                  <li key={String(item._id)}>
                    <span aria-hidden="true">✓</span>
                    <div>
                      <strong>{humanize(item.toStatus)}</strong>
                      <p>
                        {item.note ||
                          `Moved from ${item.fromStatus ? humanize(item.fromStatus) : "booking creation"}`}
                      </p>
                      <time>
                        {dateTime(item.createdAt)}
                        {item.changedBy
                          ? ` · ${item.changedBy.firstName} ${item.changedBy.lastName}`
                          : ""}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="report-empty">
                No workflow activity has been recorded.
              </p>
            )}
          </section>

          {booking.status === "AWAITING_APPROVAL" && diagnosis && (
            <section className="admin-action-stack">
              <QuotationBuilder
                bookingId={id}
                diagnosisId={String(diagnosis._id)}
                mode="admin"
              />
              <DiagnosisRevisionForm
                bookingId={id}
                nextRevision={diagnosis.revision + 1}
              />
            </section>
          )}
          {booking.status === "QUALITY_CHECK" && repairReport && (
            <>
              <section className="panel admin-detail-section">
                <header>
                  <span>03</span>
                  <div>
                    <h2>Submitted repair report</h2>
                    <p>
                      Review the technician’s work before making a quality
                      decision
                    </p>
                  </div>
                </header>
                <div className="admin-repair-grid">
                  <div>
                    <h3>Work performed</h3>
                    {repairReport.workPerformed?.length ? (
                      <ul>
                        {repairReport.workPerformed.map((item: string) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>None recorded.</p>
                    )}
                  </div>
                  <div>
                    <h3>Parts replaced</h3>
                    {repairReport.partsUsed?.length ? (
                      <ul>
                        {repairReport.partsUsed.map(
                          (part: any, index: number) => (
                            <li key={`${part.name}-${index}`}>
                              {part.name} × {part.quantity}
                            </li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p>No parts replaced.</p>
                    )}
                  </div>
                  <div>
                    <h3>Tests and results</h3>
                    {repairReport.testResults?.length ? (
                      <ul>
                        {repairReport.testResults.map((item: string) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>None recorded.</p>
                    )}
                  </div>
                  <div>
                    <h3>Completion details</h3>
                    <p>{repairReport.finalNotes}</p>
                    <small>
                      {repairReport.warrantyDays || 0}-day warranty · Submitted{" "}
                      {dateTime(repairReport.submittedAt)}
                    </small>
                  </div>
                </div>
              </section>
              <div className="admin-primary-action">
                <QualityCheckForm bookingId={id} />
              </div>
            </>
          )}
          {booking.status === "READY_FOR_COLLECTION" &&
            repairReport?.qualityCheckResult === "PASSED" && (
              <div className="admin-primary-action">
                <HandoverForm
                  bookingId={id}
                  suggestedAmount={
                    booking.finalAmount ?? booking.basePriceSnapshot ?? 0
                  }
                />
              </div>
            )}
          {booking.status === "COMPLETED" && (
            <section className="panel admin-completed-card">
              <span aria-hidden="true">✓</span>
              <div>
                <p>Booking completed</p>
                <h2>Device handed over successfully</h2>
                <dl>
                  <div>
                    <dt>Received by</dt>
                    <dd>{booking.handoverRecipient}</dd>
                  </div>
                  <div>
                    <dt>Final amount</dt>
                    <dd>{formatCurrency(booking.finalAmount)}</dd>
                  </div>
                  <div>
                    <dt>Completed</dt>
                    <dd>{dateTime(booking.handoverAt)}</dd>
                  </div>
                </dl>
                <small>
                  This terminal booking is locked from normal workflow edits.
                </small>
              </div>
            </section>
          )}
        </div>

        <aside className="admin-booking-aside">
          <section className="panel admin-summary-card">
            <h2>Booking overview</h2>
            <dl>
              <div>
                <dt>Customer</dt>
                <dd>
                  {booking.customerId?.firstName} {booking.customerId?.lastName}
                  <span>{booking.customerId?.email}</span>
                  <span>{booking.customerId?.phone || "No phone number"}</span>
                </dd>
              </div>
              <div>
                <dt>Device</dt>
                <dd>
                  {booking.deviceId?.brand} {booking.deviceId?.model}
                  <span>
                    {humanize(booking.deviceId?.type || "Device")} ·{" "}
                    {booking.deviceId?.serialNumber || "No serial"}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Service method</dt>
                <dd>{humanize(booking.serviceMethod)}</dd>
              </div>
              <div>
                <dt>Appointment</dt>
                <dd>
                  {shortDate(booking.preferredDate)}
                  <span>
                    {booking.preferredTimeSlot || "No preferred time"}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Price estimate</dt>
                <dd>{formatCurrency(booking.basePriceSnapshot)}</dd>
              </div>
              {assignment?.technicianId && (
                <div>
                  <dt>Assigned technician</dt>
                  <dd>
                    {assignment.technicianId.firstName}{" "}
                    {assignment.technicianId.lastName}
                    <span>
                      {assignment.acceptedAt
                        ? "Assignment accepted"
                        : "Awaiting acceptance"}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </section>
          <section className="panel admin-services-card">
            <h2>Selected services</h2>
            {booking.serviceIds?.map((service: any) => (
              <div key={String(service._id)}>
                <span>
                  <strong>{service.name}</strong>
                  <small>{humanize(service.category)}</small>
                </span>
                <b>{formatCurrency(service.basePrice)}</b>
              </div>
            ))}
          </section>
          {(actions.length > 0 || booking.status === "RECEIVED") && (
            <section className="panel admin-workflow-actions">
              <header>
                <p>Next action</p>
                <h2>Manage workflow</h2>
              </header>
              {actions.map((to) => (
                <form
                  action={adminTransitionAction.bind(null, id, to)}
                  key={to}
                >
                  <label>
                    Administrative note{" "}
                    {to === "REJECTED" && (
                      <span className="required-marker">*</span>
                    )}
                    <textarea
                      name="reason"
                      rows={3}
                      required={to === "REJECTED"}
                      minLength={to === "REJECTED" ? 5 : undefined}
                      placeholder={
                        to === "REJECTED"
                          ? "Explain why this request is being rejected"
                          : "Add an optional internal note"
                      }
                    />
                  </label>
                  <button
                    className={`btn ${to === "REJECTED" ? "secondary" : ""}`}
                  >
                    {labels[to] || humanize(to)}
                  </button>
                </form>
              ))}
              {booking.status === "RECEIVED" && (
                <AssignTechnicianForm
                  bookingId={id}
                  technicians={availableTechnicians
                    .filter((item) => item.userId)
                    .map((item) => ({
                      id: String(item.userId._id),
                      label: `${item.userId.firstName} ${item.userId.lastName} · ${item.activeJobCount}/${item.maximumActiveJobs} jobs`,
                    }))}
                />
              )}
            </section>
          )}
          {!actions.length &&
            booking.status !== "RECEIVED" &&
            !["QUALITY_CHECK", "READY_FOR_COLLECTION"].includes(
              booking.status,
            ) && (
              <section className="panel admin-no-action">
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>No administrator action needed</strong>
                  <p>
                    This booking is currently with the customer or technician.
                  </p>
                </div>
              </section>
            )}
        </aside>
      </div>
    </>
  );
}
