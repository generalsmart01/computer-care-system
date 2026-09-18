import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Service } from "@/models/Service";
import { setServiceActiveAction } from "@/features/services/service.actions";
import {
  PageHeader,
  StatusBadge,
  EmptyState,
} from "@/components/ui/dashboard-ui";
import { formatCurrency, humanize } from "@/lib/presentation";

export default async function Page() {
  await connectDB();
  const list = await Service.find().sort({ name: 1 }).lean();
  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Services"
        description="Manage repair offerings, pricing, and availability."
        actionHref="/admin/services/new"
        actionLabel="New service"
      />
      {!list.length && (
        <EmptyState
          title="No services"
          message="Create the first service offered to customers."
          actionHref="/admin/services/new"
          actionLabel="Create service"
        />
      )}
      <div className="service-admin-grid">
        {list.map((service: any) => (
          <article
            className="panel admin-service-card"
            key={String(service._id)}
          >
            <div>
              <StatusBadge value={service.isActive ? "ACTIVE" : "INACTIVE"} />
              <span className="service-category">
                {humanize(service.category)}
              </span>
            </div>
            <h2>
              <Link href={`/admin/services/${service._id}`}>
                {service.name}
              </Link>
            </h2>
            <p>{service.shortDescription}</p>
            <p className="service-device-label">{service.supportedDeviceTypes?.length ? `For ${service.supportedDeviceTypes.map((type: string) => type.toLowerCase()).join(", ")}` : "All supported devices"}</p>
            <strong className="service-price">
              {formatCurrency(service.basePrice)}
              <small> base price</small>
            </strong>
            <form
              action={setServiceActiveAction.bind(
                null,
                String(service._id),
                !service.isActive,
              )}
            >
              <Link
                className="text-link"
                href={`/admin/services/${service._id}`}
              >
                Edit details
              </Link>
              <button className="btn secondary">
                {service.isActive ? "Deactivate" : "Activate"}
              </button>
            </form>
          </article>
        ))}
      </div>
    </>
  );
}
