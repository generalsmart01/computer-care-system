import { connectDB } from "@/lib/db";
import { TechnicianProfile } from "@/models/TechnicianProfile";
import { notFound } from "next/navigation";
import { TechnicianForm } from "@/components/forms/technician-form";

export default async function Page({ params }: { params: Promise<{ technicianId: string }> }) {
  await connectDB(); const profile:any = await TechnicianProfile.findById((await params).technicianId).populate("userId").lean();
  if (!profile || !profile.userId) notFound(); const user: any = profile.userId;
  return <><h1>{user.firstName} {user.lastName}</h1><p><span className="status">{user.status}</span> · {profile.availabilityStatus} · {profile.activeJobCount}/{profile.maximumActiveJobs} jobs</p>
    <TechnicianForm technician={{ id: String(profile._id), firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, status: user.status, employeeNumber: profile.employeeNumber, specializations: profile.specializations, yearsOfExperience: profile.yearsOfExperience, availabilityStatus: profile.availabilityStatus, maximumActiveJobs: profile.maximumActiveJobs, bio: profile.bio }}/>
  </>;
}
