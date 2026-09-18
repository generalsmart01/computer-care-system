import { connectDB } from "@/lib/db";
import { Service } from "@/models/Service";
import Link from "next/link";
import { formatCurrency } from "@/lib/presentation";
export const metadata = { title: "Services" };
export const dynamic = "force-dynamic";
const groups = [
  { title: "Computer care", types: ["LAPTOP", "DESKTOP"], description: "Diagnostics, repair, upgrades, and maintenance for laptops and desktops." },
  { title: "Tablet care", types: ["TABLET"], description: "Screen, battery, charging, and software care for tablets." },
  { title: "Phone care", types: ["PHONE"], description: "Assessment and repair for phone displays, batteries, charging, and software." },
] as const;
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
          <h1>Care for computers, tablets, and phones.</h1>
          <p>
            Every service enters the same transparent workflow, with diagnosis
            and approval requirements shown before repair begins.
          </p>
        </div>
      </section>
      <section className="section container">
        {services.length ? (
          <>
          {groups.map(group => {
            const matching = services.filter(service => service.supportedDeviceTypes?.some((type: string) => (group.types as readonly string[]).includes(type)));
            return matching.length ? <section className="service-group" key={group.title}>
              <div className="section-heading"><div><p className="eyebrow">Device services</p><h2>{group.title}</h2><p>{group.description}</p></div></div>
              <div className="grid service-grid">{matching.map((service: any) => (
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
              ))}</div>
            </section> : null;
          })}
          {services.some(service => !service.supportedDeviceTypes?.length) && <section className="service-group">
            <div className="section-heading"><div><p className="eyebrow">Additional support</p><h2>General services</h2><p>Services available across supported devices.</p></div></div>
            <div className="grid service-grid">{services.filter(service => !service.supportedDeviceTypes?.length).map((service: any) => <Link className="card service-card" href={`/services/${service.slug}`} key={String(service._id)}><span className="service-icon" aria-hidden="true">{service.name.charAt(0)}</span><p className="eyebrow">{String(service.category).replaceAll("_", " ")}</p><h2>{service.name}</h2><p>{service.shortDescription}</p><div><strong>From {formatCurrency(service.basePrice)}</strong><span>View details →</span></div></Link>)}</div>
          </section>}
          </>
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
          <Link className="btn accent" href="/dashboard/bookings/new">
            Start a booking
          </Link>
        </div>
      </section>
    </main>
  );
}
