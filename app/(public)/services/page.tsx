import { connectDB } from "@/lib/db";
import { Service } from "@/models/Service";
import Link from "next/link";
import { formatCurrency } from "@/lib/presentation";
export const metadata = { title: "Services" };
export default async function Page() {
  let services: any[] = [];
  try {
    await connectDB();
    services = await Service.find({ isActive: true })
      .sort({ category: 1, name: 1 })
      .lean();
  } catch {}
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">Maintenance and repair</p>
          <h1>Choose the service that matches the problem.</h1>
          <p>
            Every service enters the same transparent workflow, with diagnosis
            and approval requirements shown before repair begins.
          </p>
        </div>
      </section>
      <section className="section container">
        {services.length ? (
          <div className="grid service-grid">
            {services.map((service: any) => (
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
                <h2>{service.name}</h2>
                <p>{service.shortDescription}</p>
                <div>
                  <strong>From {formatCurrency(service.basePrice)}</strong>
                  <span>View details →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="card">
            Services will appear here after the initial service seed is run.
          </p>
        )}
      </section>
      <section className="section container">
        <div className="cta-panel">
          <div>
            <h2>Not sure which service fits?</h2>
            <p>
              Describe the symptoms in a booking and select the closest service;
              diagnosis confirms the right work.
            </p>
          </div>
          <Link className="btn accent" href="/register">
            Start a booking
          </Link>
        </div>
      </section>
    </main>
  );
}
