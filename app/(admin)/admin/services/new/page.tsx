import { ServiceForm } from "@/components/forms/service-form";

export default function Page() {
  return <>
    <h1>New service</h1>
    <p className="muted">New services are active by default and immediately become available to customers.</p>
    <ServiceForm />
  </>;
}
