import { requireCustomer } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import { BookingStatusHistory } from "@/models/BookingStatusHistory";
import { Diagnosis } from "@/models/Diagnosis";
import { Quotation } from "@/models/Quotation";
import { cancelBookingAction } from "@/features/bookings/booking.actions";
import { QuotationResponseForm } from "@/components/booking/quotation-response-form";
import { Review } from "@/models/Review";
import { RepairReport } from "@/models/RepairReport";
import { ReviewForm } from "@/components/booking/review-form";
import { getCustomerBooking } from "@/features/security/resource-access.service";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/dashboard-ui";
import { formatCurrency, humanize, shortDate } from "@/lib/presentation";

export default async function Page({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const user = await requireCustomer(),
    id = (await params).bookingId;
  await connectDB();
  const [
    bookingResult,
    history,
    diagnosisResult,
    quotationResult,
    reviewResult,
    repairReportResult,
  ] = await Promise.all([
    getCustomerBooking(user.id, id),
    BookingStatusHistory.find({ bookingId: id }).sort({ createdAt: 1 }).lean(),
    Diagnosis.findOne({
      bookingId: id,
      status: { $in: ["SUBMITTED", "APPROVED"] },
    })
      .sort({ revision: -1 })
      .lean(),
    Quotation.findOne({
      bookingId: id,
      status: { $in: ["PENDING", "APPROVED", "REJECTED"] },
    })
      .sort({ version: -1 })
      .lean(),
    Review.findOne({ bookingId: id, customerId: user.id }).lean(),
    RepairReport.findOne({ bookingId: id, submittedAt: { $exists: true } })
      .select(
        "workPerformed partsUsed testResults finalNotes warrantyDays qualityCheckResult submittedAt completedAt",
      )
      .lean(),
  ]);
  const booking: any = bookingResult,
    diagnosis: any = diagnosisResult,
    quotation: any = quotationResult,
    review: any = reviewResult,
    repairReport: any = repairReportResult;
  const cancellable = ["PENDING", "CONFIRMED", "AWAITING_DEVICE"].includes(
    booking.status,
  );
  const device = booking.deviceId,
    services = booking.serviceIds || [],
    terminal = ["COMPLETED", "CANCELLED", "REJECTED"].includes(booking.status);
  return (
    <>
      <Link className="back-link" href="/dashboard/bookings">
        ← Back to bookings
      </Link>
      <header className="booking-detail-hero">
        <div>
          <p className="eyebrow">{booking.reference}</p>
          <h1>{booking.problemTitle}</h1>
          <p>Created {shortDate(booking.createdAt)}</p>
        </div>
        <StatusBadge value={booking.status} />
      </header>
      <section className="booking-progress panel">
        <div>
          <strong>
            {terminal ? humanize(booking.status) : "Repair in progress"}
          </strong>
          <span>
            {history.length} recorded update{history.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="booking-progress-track">
          <span
            style={{
              width: terminal
                ? "100%"
                : `${Math.min(92, Math.max(8, history.length * 12))}%`,
            }}
          />
        </div>
      </section>
      <div className="booking-detail-layout">
        <div className="booking-detail-main">
          <section className="panel detail-section">
            <header>
              <span>01</span>
              <div>
                <h2>Issue details</h2>
                <p>Information submitted with this repair request.</p>
              </div>
            </header>
            <h3>{booking.problemTitle}</h3>
            <p>{booking.problemDescription}</p>
            {booking.symptoms?.length > 0 && (
              <div className="tag-list">
                {booking.symptoms.map((item: string) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            )}
          </section>
          <section className="panel detail-section">
            <header>
              <span>02</span>
              <div>
                <h2>Repair timeline</h2>
                <p>Every recorded workflow update in chronological order.</p>
              </div>
            </header>
            <ol className="enhanced-timeline">
              {history.map((entry: any, index: number) => (
                <li key={String(entry._id)}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{humanize(entry.toStatus)}</strong>
                    <p>{entry.note || "Status updated"}</p>
                    <time>{new Date(entry.createdAt).toLocaleString()}</time>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className="panel detail-section">
            <header>
              <span>03</span>
              <div>
                <h2>Diagnosis</h2>
                <p>Technician findings visible to you.</p>
              </div>
            </header>
            {diagnosis ? (
              <div className="diagnosis-summary">
                <p>{diagnosis.customerSummary}</p>
                <div>
                  <strong>Recommended work</strong>
                  <span>{diagnosis.recommendedAction}</span>
                </div>
              </div>
            ) : (
              <div className="pending-block">
                <strong>Diagnosis not available yet</strong>
                <p>
                  Findings will appear here after the technician submits the
                  diagnosis.
                </p>
              </div>
            )}
          </section>
          <section className="panel detail-section quotation-section">
            <header>
              <span>04</span>
              <div>
                <h2>Quotation</h2>
                <p>Review pricing before quotation-based repair work begins.</p>
              </div>
            </header>
            {quotation ? (
              <>
                <div className="quotation-meta">
                  <StatusBadge value={quotation.status} />
                  <span>Version {quotation.version}</span>
                  <span>Valid until {shortDate(quotation.validUntil)}</span>
                </div>
                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotation.items.map((item: any, index: number) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td>{humanize(item.type)}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <dl className="quotation-totals">
                  <div>
                    <dt>Subtotal</dt>
                    <dd>{formatCurrency(quotation.subtotal)}</dd>
                  </div>
                  <div>
                    <dt>Discount</dt>
                    <dd>− {formatCurrency(quotation.discount)}</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{formatCurrency(quotation.total)}</dd>
                  </div>
                </dl>
                {quotation.customerResponseNote && (
                  <p className="response-note">
                    <strong>Your response:</strong>{" "}
                    {quotation.customerResponseNote}
                  </p>
                )}
                {quotation.status === "PENDING" && (
                  <QuotationResponseForm
                    quotationId={String(quotation._id)}
                    expired={new Date(quotation.validUntil) <= new Date()}
                  />
                )}{" "}
                {quotation.status === "REJECTED" && (
                  <p className="pending-block">
                    The administrator can review your response and issue a
                    revised quotation.
                  </p>
                )}
              </>
            ) : (
              <div className="pending-block">
                <strong>No quotation available</strong>
                <p>
                  A quotation will appear after diagnosis when approval is
                  required.
                </p>
              </div>
            )}
          </section>
          {repairReport && (
            <section className="panel detail-section">
              <header>
                <span>05</span>
                <div>
                  <h2>Repair report</h2>
                  <p>Completed work and post-repair verification.</p>
                </div>
              </header>
              <div className="report-status">
                <StatusBadge value={repairReport.qualityCheckResult} />
                <span>
                  {repairReport.completedAt
                    ? `Completed ${new Date(repairReport.completedAt).toLocaleString()}`
                    : `Submitted ${new Date(repairReport.submittedAt).toLocaleString()}`}
                </span>
              </div>
              <div className="report-grid">
                <div>
                  <h3>Work performed</h3>
                  <ul>
                    {repairReport.workPerformed.map((item: string) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Tests and results</h3>
                  <ul>
                    {repairReport.testResults.map((item: string) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                {repairReport.partsUsed.length > 0 && (
                  <div>
                    <h3>Parts replaced</h3>
                    <ul>
                      {repairReport.partsUsed.map(
                        (part: any, index: number) => (
                          <li key={`${part.name}-${index}`}>
                            {part.name} × {part.quantity}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
                <div>
                  <h3>Coverage</h3>
                  <p>{repairReport.warrantyDays || 0} days warranty</p>
                </div>
              </div>
              <p>
                <strong>Final notes:</strong> {repairReport.finalNotes}
              </p>
              {booking.status === "COMPLETED" && (
                <div className="handover-summary">
                  <span>
                    Received by <strong>{booking.handoverRecipient}</strong>
                  </span>
                  <span>
                    Final amount{" "}
                    <strong>{formatCurrency(booking.finalAmount)}</strong>
                  </span>
                </div>
              )}
            </section>
          )}
        </div>
        <aside className="booking-detail-aside">
          <section className="panel booking-summary-card">
            <h2>Booking summary</h2>
            <dl>
              <div>
                <dt>Device</dt>
                <dd>
                  {device?.brand} {device?.model}
                  <span>{humanize(device?.type || "")}</span>
                </dd>
              </div>
              <div>
                <dt>Services</dt>
                <dd>
                  {services.map((service: any) => service.name).join(", ")}
                </dd>
              </div>
              <div>
                <dt>Method</dt>
                <dd>{humanize(booking.serviceMethod)}</dd>
              </div>
              <div>
                <dt>Appointment</dt>
                <dd>
                  {shortDate(booking.preferredDate)}
                  <span>
                    {booking.preferredTimeSlot || "Time to be confirmed"}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Base estimate</dt>
                <dd>{formatCurrency(booking.basePriceSnapshot)}</dd>
              </div>
            </dl>
          </section>
          {cancellable && (
            <details className="panel cancel-panel">
              <summary>Need to cancel this booking?</summary>
              <form action={cancelBookingAction.bind(null, id)}>
                <label>
                  Cancellation reason <span className="required-marker">*</span>
                  <textarea name="reason" required minLength={5} rows={4} />
                </label>
                <button className="btn">Cancel booking</button>
              </form>
            </details>
          )}
        </aside>
      </div>
      {booking.status === "COMPLETED" &&
        (review ? (
          <section className="panel customer-review">
            <h2>Your review</h2>
            <p aria-label={`${review.rating} out of 5 stars`}>
              {"★".repeat(review.rating)}
              {"☆".repeat(5 - review.rating)}
            </p>
            {review.comment && <p>{review.comment}</p>}
            <small>
              Submitted {new Date(review.createdAt).toLocaleString()}
            </small>
          </section>
        ) : (
          <ReviewForm bookingId={id} />
        ))}
    </>
  );
}
