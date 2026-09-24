import Link from "next/link";
import { connectDB } from "@/lib/db";
import { formatCurrency } from "@/lib/presentation";
import { Service } from "@/models/Service";

export const metadata = { title: "Services" };
export const dynamic = "force-dynamic";

type PublicService = {
  _id: unknown;
  name: string;
  slug: string;
  category: string;
  supportedDeviceTypes?: string[];
  shortDescription: string;
  basePrice: number;
};

const categoryCopy: Record<string, { title: string; description: string }> = {
  HARDWARE_DIAGNOSTICS: {
    title: "Diagnostics and assessment",
    description:
      "Identify hardware, power, display, charging, and performance faults before repair begins.",
  },
  HARDWARE_REPAIR: {
    title: "Hardware repair",
    description:
      "Repair and replacement services for damaged or failing physical components.",
  },
  SOFTWARE_INSTALLATION: {
    title: "Software and system recovery",
    description:
      "Operating-system, startup, update, and software recovery services.",
  },
  DATA_RECOVERY: {
    title: "Data recovery",
    description:
      "Assessment and recovery options for inaccessible or at-risk data.",
  },
  VIRUS_REMOVAL: {
    title: "Security and malware removal",
    description:
      "Detection and removal of malware, unwanted software, and related system problems.",
  },
  NETWORK_SETUP: {
    title: "Network support",
    description:
      "Connectivity, network configuration, and related device support.",
  },
  PREVENTIVE_MAINTENANCE: {
    title: "Preventive maintenance",
    description:
      "Cleaning, cooling, inspection, and maintenance that helps prevent future failures.",
  },
  SYSTEM_UPGRADE: {
    title: "Upgrades",
    description:
      "Compatibility checks and upgrades for storage, memory, and other supported components.",
  },
  OTHER: {
    title: "Additional services",
    description:
      "Other repair and maintenance services available from ComputerCare.",
  },
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function serviceDevices(types: string[] = []) {
  if (!types.length) return "All supported devices";
  return types.map(humanize).join(" · ");
}

export default async function Page() {
  let services: PublicService[] = [];
  let loadFailed = false;

  try {
    await connectDB();
    services = (await Service.find({ isActive: true })
      .select(
        "name slug category supportedDeviceTypes shortDescription basePrice",
      )
      .sort({ category: 1, name: 1 })
      .lean()) as unknown as PublicService[];
  } catch (error) {
    loadFailed = true;
    console.error("Public services could not be loaded", error);
  }

  const groupedServices = services.reduce<Map<string, PublicService[]>>(
    (groups, service) => {
      const category = service.category || "OTHER";
      groups.set(category, [...(groups.get(category) ?? []), service]);
      return groups;
    },
    new Map(),
  );

  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">Maintenance and repair</p>
          <h1>Care for computers, tablets, and phones.</h1>
          <p>
            Browse every active service currently available from ComputerCare.
            Starting prices are estimates; diagnosis confirms the required work.
          </p>
        </div>
      </section>

      <section className="section container">
        {loadFailed ? (
          <div className="card" role="alert">
            <h2>Services are temporarily unavailable</h2>
            <p>
              We could not load the service catalogue. Please refresh the page
              or try again shortly.
            </p>
          </div>
        ) : services.length ? (
          <>
            <header className="section-heading">
              <div>
                <p className="eyebrow">Available now</p>
                <h2>{services.length} care services</h2>
                <p>
                  Select a service to see its scope, supported devices, starting
                  price, and approval requirements.
                </p>
              </div>
            </header>

            {[...groupedServices.entries()].map(([category, items]) => {
              const copy = categoryCopy[category] ?? {
                title: humanize(category),
                description:
                  "ComputerCare services currently available in this category.",
              };

              return (
                <section className="service-group" key={category}>
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">{items.length} available</p>
                      <h2>{copy.title}</h2>
                      <p>{copy.description}</p>
                    </div>
                  </div>

                  <div className="grid service-grid">
                    {items.map((service) => (
                      <Link
                        className="card service-card"
                        href={`/services/${service.slug}`}
                        key={String(service._id)}
                      >
                        <span className="service-icon" aria-hidden="true">
                          {service.name.charAt(0)}
                        </span>
                        <p className="eyebrow">
                          {humanize(service.category)}
                        </p>
                        <h3>{service.name}</h3>
                        <p>{service.shortDescription}</p>
                        <small>
                          {serviceDevices(service.supportedDeviceTypes)}
                        </small>
                        <div>
                          <strong>
                            From {formatCurrency(service.basePrice)}
                          </strong>
                          <span>View details →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        ) : (
          <div className="card">
            <h2>No services are currently available</h2>
            <p>
              The catalogue is connected, but no active services have been
              published yet.
            </p>
          </div>
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
