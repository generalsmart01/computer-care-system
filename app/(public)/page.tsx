import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Service } from "@/models/Service";
import { Review } from "@/models/Review";
import { FAQS, PROCESS_STEPS, TRUST_REASONS } from "@/lib/public-content";
import { formatCurrency } from "@/lib/presentation";
export const dynamic = "force-dynamic";
export default async function Home() {
  let services: any[] = [],
    reviews: any[] = [];
  try {
    await connectDB();
    [services, reviews] = await Promise.all([
      Service.find({ isActive: true }).sort({ name: 1 }).lean(),
      Review.find({ isHidden: false, comment: { $nin: [null, ""] } })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
    ]);
  } catch {}
  const featuredServices = ["LAPTOP", "TABLET", "PHONE"]
    .flatMap(type => services.filter(service => service.supportedDeviceTypes?.includes(type)).slice(0, 2))
    .filter((service, index, all) => all.findIndex(other => String(other._id) === String(service._id)) === index)
    .slice(0, 6);
  if (!featuredServices.length) featuredServices.push(...services.slice(0, 6));
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Device care, made accountable</p>
            <h1>Know what is happening to your computer, tablet, or phone.</h1>
            <p className="hero-copy">
              From diagnosis to quotation, repair, quality check, and
              handover—ComputerCare keeps every decision clear and every
              milestone visible.
            </p>
            <div className="button-row">
              <Link className="btn accent" href="/dashboard/bookings/new">
                Start a booking
              </Link>
              <Link className="btn ghost" href="/services">
                Explore services
              </Link>
            </div>
            <ul className="hero-points">
              <li>Approval before quotation-based work</li>
              <li>Secure status tracking</li>
              <li>Recorded quality checks</li>
            </ul>
          </div>
          <div
            className="workflow-preview"
            aria-label="Repair workflow preview"
          >
            <p className="status">LIVE WORKFLOW</p>
            {[
              "Booking received",
              "Diagnosis documented",
              "Quotation approved",
              "Repair quality checked",
            ].map((label, index) => (
              <div className="preview-step" key={label}>
                <span>{index + 1}</span>
                <div>
                  <strong>{label}</strong>
                  <small>
                    {index < 3 ? "Complete" : "Ready for collection"}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Expert help for everyday technology</p>
            <h2>Services built around a clear outcome</h2>
          </div>
          <Link href="/services">View every service →</Link>
        </div>
        {featuredServices.length ? (
          <div className="grid service-grid">
            {featuredServices.map((service: any) => (
              <Link
                className="card service-card"
                href={`/services/${service.slug}`}
                key={String(service._id)}
              >
                <span className="service-icon" aria-hidden="true">
                  {service.name.charAt(0)}
                </span>
                <p className="eyebrow">
                  {String(service.category).replaceAll("_", " ")}
                </p>
                <h3>{service.name}</h3>
                <p>{service.shortDescription}</p>
                <div>
                  <strong>From {formatCurrency(service.basePrice)}</strong>
                  <span>Learn more →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="card">
            Service availability is being prepared. You can still create an
            account and return when the catalog is ready.
          </p>
        )}
      </section>
      <section className="section surface">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Four simple stages</p>
              <h2>How ComputerCare works</h2>
            </div>
          </div>
          <ol className="process-grid">
            {PROCESS_STEPS.map((step, index) => (
              <li key={step.title}>
                <span>0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="section container split-section">
        <div>
          <p className="eyebrow">Why choose us</p>
          <h2>Repair decisions should never feel like guesswork.</h2>
          <p className="lead">
            Our workflow separates diagnosis, approval, repair, and quality
            checking so you always know what comes next.
          </p>
          <Link className="btn" href="/about">
            How we work
          </Link>
        </div>
        <div className="trust-list">
          {TRUST_REASONS.map((reason) => (
            <article key={reason.title}>
              <span aria-hidden="true">✓</span>
              <div>
                <h3>{reason.title}</h3>
                <p>{reason.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section testimonials">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Customer feedback</p>
              <h2>Repairs remembered for clarity</h2>
            </div>
          </div>
          {reviews.length ? (
            <div className="grid cards">
              {reviews.map((review: any) => (
                <blockquote className="card quote" key={String(review._id)}>
                  <p aria-label={`${review.rating} out of 5 stars`}>
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </p>
                  <p>“{review.comment}”</p>
                  <footer>Verified completed booking</footer>
                </blockquote>
              ))}
            </div>
          ) : (
            <div className="grid cards">
              {[
                "The quotation and each repair stage stay visible in one place.",
                "Quality checking happens before the device is marked ready.",
                "The service history remains attached to the customer’s booking.",
              ].map((text) => (
                <blockquote className="card quote" key={text}>
                  <p>“{text}”</p>
                  <footer>How the ComputerCare workflow is designed</footer>
                </blockquote>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="section container faq-preview">
        <div>
          <p className="eyebrow">Questions, answered</p>
          <h2>Before you book</h2>
          <p>
            Understand diagnosis, approval, tracking, and collection before
            handing over your device.
          </p>
          <Link href="/faq">Read all FAQs →</Link>
        </div>
        <div>
          {FAQS.slice(0, 3).map((item) => (
            <details className="card" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="section container">
        <div className="cta-panel">
          <div>
            <p className="eyebrow">Ready when your computer is not</p>
            <h2>Start with the symptoms. We will make the next steps clear.</h2>
          </div>
          <div className="button-row">
            <Link className="btn accent" href="/register">
              Book a repair
            </Link>
            <Link className="btn ghost" href="/contact">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
