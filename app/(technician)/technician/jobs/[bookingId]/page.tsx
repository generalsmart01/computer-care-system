import Link from "next/link";
import { notFound } from "next/navigation";
import { AcceptAssignmentForm } from "@/components/booking/accept-assignment-form";
import { DiagnosisForm } from "@/components/booking/diagnosis-form";
import { QuotationBuilder } from "@/components/booking/quotation-builder";
import { RepairSubmissionForm } from "@/components/booking/repair-submission-form";
import { RepairTrackingForm } from "@/components/booking/repair-tracking-form";
import { StartDiagnosisForm } from "@/components/booking/start-diagnosis-form";
import { StartRepairForm } from "@/components/booking/start-repair-form";
import { StatusBadge } from "@/components/ui/dashboard-ui";
import { formatParts } from "@/features/diagnoses/diagnosis.validation";
import {
  formatPartsUsed,
  formatTrackingLines,
} from "@/features/repairs/repair-tracking.validation";
import { connectDB } from "@/lib/db";
import { formatCurrency, humanize, shortDate } from "@/lib/presentation";
import { requireTechnician } from "@/lib/permissions";
import { Assignment } from "@/models/Assignment";
import { Booking } from "@/models/Booking";
import { Device } from "@/models/Device";
import { Diagnosis } from "@/models/Diagnosis";
import { RepairReport } from "@/models/RepairReport";
import { Service } from "@/models/Service";
import { User } from "@/models/User";

const stages = [
  "ASSIGNED",
  "DIAGNOSING",
  "AWAITING_APPROVAL",
  "APPROVED",
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
  const technician = await requireTechnician(),
    id = (await params).bookingId;
  await connectDB();
  const assignmentResult = await Assignment.findOne({
    bookingId: id,
    technicianId: technician.id,
    status: { $in: ["ACTIVE", "COMPLETED"] },
  })
    .sort({ assignedAt: -1 })
    .lean();
  if (!assignmentResult) notFound();
  const [bookingResult, diagnosisResults, repairReportResult] =
    await Promise.all([
      Booking.findById(id)
        .populate({
          path: "customerId",
          model: User,
          select: "firstName lastName phone",
        })
        .populate({
          path: "deviceId",
          model: Device,
          select:
            "type brand model serialNumber operatingSystem processor ram storage",
        })
        .populate({
          path: "serviceIds",
          model: Service,
          select: "name category basePrice requiresQuotationApproval",
        })
        .lean(),
      Diagnosis.find({ bookingId: id, technicianId: technician.id })
        .select("+internalNotes")
        .sort({ revision: -1 })
        .lean(),
      RepairReport.findOne({ bookingId: id }).lean(),
    ]);
  const booking: any = bookingResult,
    assignment: any = assignmentResult,
    diagnoses: any[] = diagnosisResults as any[],
    repairReport: any = repairReportResult;
  if (!booking) notFound();
  const isActiveAssignment = assignment.status === "ACTIVE";
  const draft: any = diagnoses.find((item) => item.status === "DRAFT");
  const submitted = diagnoses.filter((item) => item.status !== "DRAFT");
  const latestSubmitted: any = submitted[0];
  const requiresQuotationApproval =
    !booking.serviceIds?.length ||
    booking.serviceIds.some(
      (service: any) => !service || service.requiresQuotationApproval !== false,
    );
  const currentStage = Math.max(0, stages.indexOf(booking.status));
  const activeTask = !assignment.acceptedAt
    ? "Accept this assignment to begin work"
    : booking.status === "ASSIGNED"
      ? "Start the device diagnosis"
      : booking.status === "DIAGNOSING"
        ? "Complete and submit the diagnosis"
        : booking.status === "AWAITING_APPROVAL"
          ? "Prepare the repair quotation"
          : booking.status === "APPROVED"
            ? "Start the approved repair"
            : booking.status === "REPAIRING"
              ? "Record repair work and test results"
              : "Monitor the booking for the next update";

  return (
    <>
      <Link className="back-link" href="/technician/jobs">
        ← Back to assigned jobs
      </Link>
      <header className="technician-job-hero">
        <div>
          <p className="eyebrow">Repair workspace</p>
          <h1>{booking.problemTitle}</h1>
          <p>
            {booking.reference} · Assigned to {technician.name}
          </p>
        </div>
        <StatusBadge value={booking.status} />
      </header>
      <section className="panel technician-task-banner">
        <span aria-hidden="true">→</span>
        <div>
          <p>Current task</p>
          <strong>{activeTask}</strong>
        </div>
        <small>
          {assignment.acceptedAt
            ? `Accepted ${dateTime(assignment.acceptedAt)}`
            : "Awaiting your acceptance"}
        </small>
      </section>
      <section className="panel technician-job-progress">
        <div>
          {stages.map((stage, index) => (
            <span
              className={index <= currentStage ? "complete" : ""}
              key={stage}
            >
              <i>{index < currentStage ? "✓" : index + 1}</i>
              <b>{humanize(stage)}</b>
            </span>
          ))}
        </div>
      </section>

      <div className="technician-job-layout">
        <div className="technician-job-main">
          <section className="panel technician-issue-card">
            <header>
              <div>
                <p>Customer-reported issue</p>
                <h2>{booking.problemTitle}</h2>
              </div>
              <span>{booking.symptoms?.length || 0} symptoms</span>
            </header>
            <p>{booking.problemDescription}</p>
            {booking.symptoms?.length ? (
              <div className="tag-list">
                {booking.symptoms.map((item: string) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : null}
          </section>

          <section className="technician-workbench">
            <header>
              <p>Work area</p>
              <h2>{humanize(booking.status)}</h2>
            </header>
            {isActiveAssignment &&
              !assignment.acceptedAt &&
              booking.status === "ASSIGNED" && (
                <AcceptAssignmentForm bookingId={id} />
              )}
            {isActiveAssignment &&
              assignment.acceptedAt &&
              booking.status === "ASSIGNED" && (
                <StartDiagnosisForm bookingId={id} />
              )}
            {isActiveAssignment &&
              assignment.acceptedAt &&
              booking.status === "DIAGNOSING" && (
                <DiagnosisForm
                  bookingId={id}
                  revision={draft?.revision}
                  draft={
                    draft
                      ? {
                          observedSymptoms: draft.observedSymptoms,
                          faultCategory: draft.faultCategory,
                          faultDescription: draft.faultDescription,
                          recommendedAction: draft.recommendedAction,
                          requiredParts: formatParts(draft.requiredParts || []),
                          internalNotes: draft.internalNotes,
                          customerSummary: draft.customerSummary,
                        }
                      : undefined
                  }
                />
              )}
            {isActiveAssignment &&
              booking.status === "AWAITING_APPROVAL" &&
              latestSubmitted &&
              requiresQuotationApproval && (
                <QuotationBuilder
                  bookingId={id}
                  diagnosisId={String(latestSubmitted._id)}
                  mode="technician"
                />
              )}
            {isActiveAssignment &&
              assignment.acceptedAt &&
              booking.status === "APPROVED" && (
                <StartRepairForm bookingId={id} />
              )}
            {isActiveAssignment &&
              assignment.acceptedAt &&
              booking.status === "AWAITING_APPROVAL" &&
              !requiresQuotationApproval &&
              latestSubmitted && (
                <StartRepairForm bookingId={id} fixedPriceBypass />
              )}
            {isActiveAssignment &&
              assignment.acceptedAt &&
              booking.status === "REPAIRING" && (
                <>
                  <RepairTrackingForm
                    bookingId={id}
                    draft={
                      repairReport
                        ? {
                            workPerformed: formatTrackingLines(
                              repairReport.workPerformed || [],
                            ),
                            partsUsed: formatPartsUsed(
                              repairReport.partsUsed || [],
                            ),
                            testResults: formatTrackingLines(
                              repairReport.testResults || [],
                            ),
                            finalNotes: repairReport.finalNotes,
                            warrantyDays: repairReport.warrantyDays,
                            qualityCheckResult: repairReport.qualityCheckResult,
                            qualityCheckNote: repairReport.qualityCheckNote,
                          }
                        : undefined
                    }
                  />
                  <RepairSubmissionForm bookingId={id} />
                </>
              )}
            {![
              "ASSIGNED",
              "DIAGNOSING",
              "AWAITING_APPROVAL",
              "APPROVED",
              "REPAIRING",
            ].includes(booking.status) && (
              <div className="technician-waiting">
                <span aria-hidden="true">✓</span>
                <h3>Your work is up to date</h3>
                <p>
                  This repair is currently at the{" "}
                  {humanize(booking.status).toLowerCase()} stage. You will see
                  the next available action here.
                </p>
              </div>
            )}
          </section>

          {submitted.length > 0 && (
            <section className="panel technician-diagnoses">
              <header>
                <div>
                  <p>Technical record</p>
                  <h2>Diagnosis revisions</h2>
                </div>
                <span>{submitted.length} submitted</span>
              </header>
              {submitted.map((item: any) => (
                <article key={String(item._id)}>
                  <div>
                    <strong>Revision {item.revision}</strong>
                    <StatusBadge value={item.status} />
                  </div>
                  <dl>
                    <div>
                      <dt>Fault category</dt>
                      <dd>{item.faultCategory}</dd>
                    </div>
                    <div>
                      <dt>Fault description</dt>
                      <dd>{item.faultDescription}</dd>
                    </div>
                    <div>
                      <dt>Recommended action</dt>
                      <dd>{item.recommendedAction}</dd>
                    </div>
                  </dl>
                  <details>
                    <summary>View private technician notes</summary>
                    <p>{item.internalNotes || "No private notes recorded."}</p>
                  </details>
                </article>
              ))}
            </section>
          )}
        </div>

        <aside className="technician-job-aside">
          <section className="panel technician-device-card">
            <p>Device</p>
            <h2>
              {booking.deviceId?.brand} {booking.deviceId?.model}
            </h2>
            <StatusBadge value={booking.deviceId?.type || "Device"} />
            <dl>
              <div>
                <dt>Serial number</dt>
                <dd>{booking.deviceId?.serialNumber || "Not supplied"}</dd>
              </div>
              <div>
                <dt>Operating system</dt>
                <dd>{booking.deviceId?.operatingSystem || "Not supplied"}</dd>
              </div>
              <div>
                <dt>Processor</dt>
                <dd>{booking.deviceId?.processor || "Not supplied"}</dd>
              </div>
              <div>
                <dt>Memory / storage</dt>
                <dd>
                  {[booking.deviceId?.ram, booking.deviceId?.storage]
                    .filter(Boolean)
                    .join(" · ") || "Not supplied"}
                </dd>
              </div>
            </dl>
          </section>
          <section className="panel technician-customer-card">
            <h2>Customer and appointment</h2>
            <dl>
              <div>
                <dt>Customer</dt>
                <dd>
                  {booking.customerId?.firstName} {booking.customerId?.lastName}
                  <span>{booking.customerId?.phone || "No phone number"}</span>
                </dd>
              </div>
              <div>
                <dt>Service method</dt>
                <dd>{humanize(booking.serviceMethod)}</dd>
              </div>
              <div>
                <dt>Preferred date</dt>
                <dd>
                  {shortDate(booking.preferredDate)}
                  <span>
                    {booking.preferredTimeSlot || "No time specified"}
                  </span>
                </dd>
              </div>
            </dl>
          </section>
          <section className="panel technician-services-card">
            <h2>Requested services</h2>
            {booking.serviceIds?.map((service: any) => (
              <div key={String(service._id)}>
                <span>
                  <strong>{service.name}</strong>
                  <small>{humanize(service.category)}</small>
                </span>
                <b>{formatCurrency(service.basePrice)}</b>
              </div>
            ))}
            <footer>
              <span>Booking estimate</span>
              <strong>{formatCurrency(booking.basePriceSnapshot)}</strong>
            </footer>
          </section>
        </aside>
      </div>
    </>
  );
}
