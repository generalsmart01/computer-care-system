import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Service } from "@/models/Service";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/presentation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connectDB();
  const service: any = await Service.findOne({
    slug: (await params).slug,
    isActive: true,
  }).lean();
  if (!service) notFound();
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">
            {String(service.category).replaceAll("_", " ")}
          </p>
          <h1>{service.name}</h1>
          <p>{service.shortDescription}</p>
          {!!service.supportedDeviceTypes?.length && <p className="service-device-label">For {service.supportedDeviceTypes.map((type: string) => type.toLowerCase()).join(", ")}</p>}
        </div>
      </section>
      <section className="section container service-detail">
        <article>
          <h2>What this service covers</h2>
          <p className="lead">{service.description}</p>
          <h2>What happens next</h2>
          <ol>
            <li>Register your device and describe the symptoms.</li>
            <li>A technician documents findings when diagnosis is required.</li>
            <li>
              {service.requiresQuotationApproval
                ? "You review and approve the quotation before repair."
                : "This fixed-price service can proceed without quotation approval."}
            </li>
            <li>Repair work and test results pass through quality checking.</li>
          </ol>
        </article>
        <aside className="card service-summary">
          <p className="eyebrow">Starting price</p>
          <strong>{formatCurrency(service.basePrice)}</strong>
          {service.estimatedDurationMinutes && (
            <p>
              Estimated workshop time: {service.estimatedDurationMinutes}{" "}
              minutes
            </p>
          )}
          <p>
            {service.requiresDiagnosis
              ? "Diagnosis included in workflow"
              : "Diagnosis may not be required"}
          </p>
          <p>
            {service.requiresQuotationApproval
              ? "Customer quotation approval required"
              : "Fixed-price approval bypass supported"}
          </p>
          <Link className="btn" href={`/dashboard/bookings/new?service=${service.slug}`}>
            Book this service
          </Link>
          <Link className="text-link" href="/services">
            ← All services
          </Link>
        </aside>
      </section>
    </main>
  );
}
