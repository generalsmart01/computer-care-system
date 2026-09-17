import { DeviceForm } from "@/components/forms/device-form";
import { PageHeader } from "@/components/ui/dashboard-ui";

export default function Page() {
  return <>
    <PageHeader eyebrow="Equipment" title="Add a device" description="Register a computer or tablet once, then select it whenever you need maintenance."/>
    <DeviceForm />
  </>;
}
