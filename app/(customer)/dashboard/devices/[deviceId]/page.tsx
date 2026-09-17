import Link from "next/link";
import { requireCustomer } from "@/lib/permissions";
import { connectDB } from "@/lib/db";
import { Device } from "@/models/Device";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ deviceId: string }> }) {
  const user = await requireCustomer();
  const id = (await params).deviceId;
  await connectDB();
  const device:any = await Device.findOne({ _id: id, ownerId: user.id }).lean();
  if (!device) notFound();
  return <>
    <h1>{device.brand} {device.model}</h1>
    {device.isActive && <p><Link className="btn" href={`/dashboard/devices/${id}/edit`}>Edit device</Link></p>}
    {!device.isActive && <p className="error" role="status">This device is inactive and cannot be edited or used for new bookings.</p>}
    <div className="card">
      <p>Type: {device.type}</p><p>Serial: {device.serialNumber || "Not supplied"}</p>
      <p>Operating system: {device.operatingSystem || "Not supplied"}</p><p>Processor: {device.processor || "Not supplied"}</p>
      <p>RAM: {device.ram || "Not supplied"}</p><p>Storage: {device.storage || "Not supplied"}</p>
      <p>Colour: {device.colour || "Not supplied"}</p><p>Notes: {device.notes || "None"}</p>
    </div>
  </>;
}
