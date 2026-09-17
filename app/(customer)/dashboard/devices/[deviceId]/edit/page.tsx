import { requireCustomer } from "@/lib/permissions";
import { DeviceForm } from "@/components/forms/device-form";
import { getCustomerDevice } from "@/features/security/resource-access.service";
import { PageHeader } from "@/components/ui/dashboard-ui";

export default async function Page({ params }: { params: Promise<{ deviceId: string }> }) {
  const user = await requireCustomer();
  const id = (await params).deviceId;
  const device:any = await getCustomerDevice(user.id, id, true);
  return <>
    <PageHeader eyebrow="Equipment" title={`Edit ${device.brand} ${device.model}`} description="Keep the identification and technical details for this device accurate."/>
    <DeviceForm device={{
      id,
      type: device.type,
      brand: device.brand,
      model: device.model,
      serialNumber: device.serialNumber,
      operatingSystem: device.operatingSystem,
      processor: device.processor,
      ram: device.ram,
      storage: device.storage,
      colour: device.colour,
      notes: device.notes,
    }}/>
  </>;
}
