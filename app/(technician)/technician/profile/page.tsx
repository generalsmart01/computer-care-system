import{requireTechnician}from"@/lib/permissions";import{connectDB}from"@/lib/db";import{TechnicianProfile}from"@/models/TechnicianProfile";import{PageHeader,StatusBadge}from"@/components/ui/dashboard-ui";
import { TechnicianAvailabilityForm } from "@/components/forms/technician-availability-form";

export default async function Page() {
  const user = await requireTechnician();
  await connectDB();
  const profile: any = await TechnicianProfile.findOne({ userId: user.id }).lean();
  const initials = user.name.split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase();
  return <>
    <PageHeader eyebrow="Technician account" title="My profile" description="Professional details and current workload configuration." />
    <section className="profile-card panel">
      <div className="profile-hero"><span className="profile-avatar">{initials}</span><div><h2>{user.name}</h2><p>{profile?.employeeNumber || "Employee number unavailable"}</p><StatusBadge value={profile?.availabilityStatus || "OFF_DUTY"} /></div></div>
      <dl className="detail-grid"><div><dt>Email address</dt><dd>{user.email}</dd></div><div><dt>Experience</dt><dd>{profile?.yearsOfExperience ?? 0} years</dd></div><div><dt>Current workload</dt><dd>{profile?.activeJobCount ?? 0} of {profile?.maximumActiveJobs ?? 0} active jobs</dd></div><div><dt>Specializations</dt><dd>{profile?.specializations?.length ? profile.specializations.join(", ") : "Not specified"}</dd></div></dl>
      {profile && <TechnicianAvailabilityForm current={profile.availabilityStatus || "OFF_DUTY"} />}
      <div className="profile-note"><strong>Professional summary</strong><p>{profile?.bio || "No biography has been added."}</p></div>
    </section>
  </>;
}
