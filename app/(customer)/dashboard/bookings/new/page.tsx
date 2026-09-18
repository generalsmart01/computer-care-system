import { requireCustomer } from "@/lib/permissions";
import { listDevices } from "@/features/devices/device.service";
import { connectDB } from "@/lib/db";
import { Service } from "@/models/Service";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { PageHeader } from "@/components/ui/dashboard-ui";

export default async function Page({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const user = await requireCustomer();
  const devices = await listDevices(user.id);
  await connectDB();
  const services = await Service.find({ isActive: true }).sort({ name: 1 }).lean();
  const requestedService = (await searchParams).service;
  return <>
    <PageHeader eyebrow="New repair request" title="Book maintenance" description="Tell us about your device and choose how you would like it serviced."/>
    <BookingWizard
      initialServiceId={services.find((service: any) => service.slug === requestedService)?._id?.toString()}
      devices={devices.map((device: any) => ({ id: String(device._id), type: device.type, label: `${device.brand} ${device.model}`, detail: `${device.type.toLowerCase()} · Added ${new Date(device.createdAt).toLocaleDateString()}` }))}
      services={services.map((service: any) => ({ id: String(service._id), label: service.name, price: service.basePrice, description: service.shortDescription, category: service.category.toLowerCase().replaceAll("_", " "), duration: service.estimatedDurationMinutes, supportedDeviceTypes: service.supportedDeviceTypes || [] }))}
    />
  </>;
}
