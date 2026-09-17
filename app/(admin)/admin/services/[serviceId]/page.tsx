import { connectDB } from "@/lib/db";
import { Service } from "@/models/Service";
import { notFound } from "next/navigation";
import { ServiceForm } from "@/components/forms/service-form";
import { setServiceActiveAction } from "@/features/services/service.actions";

export default async function Page({ params }: { params: Promise<{ serviceId: string }> }) {
  await connectDB();
  const service:any = await Service.findById((await params).serviceId).lean();
  if (!service) notFound();
  const id = String(service._id);
  return <>
    <h1>Edit {service.name}</h1>
    <p><span className="status">{service.isActive ? "ACTIVE" : "INACTIVE"}</span></p>
    <form action={setServiceActiveAction.bind(null, id, !service.isActive)}>
      <button className="btn secondary">{service.isActive ? "Deactivate service" : "Activate service"}</button>
    </form>
    <ServiceForm service={{
      id,
      name: service.name,
      slug: service.slug,
      category: service.category,
      shortDescription: service.shortDescription,
      description: service.description,
      basePrice: service.basePrice,
      estimatedDurationMinutes: service.estimatedDurationMinutes,
      requiresDiagnosis: service.requiresDiagnosis,
      requiresQuotationApproval: service.requiresQuotationApproval,
    }}/>
  </>;
}
