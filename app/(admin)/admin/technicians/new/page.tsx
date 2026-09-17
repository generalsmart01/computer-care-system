import { TechnicianForm } from "@/components/forms/technician-form";
import { requireSuperAdmin } from "@/lib/permissions";
export default async function Page() {
  await requireSuperAdmin();
  return (
    <>
      <h1>Create technician</h1>
      <p className="muted">
        Technician accounts are administrator-managed. After creation, the
        technician receives a secure email invitation to verify their address
        and create their own password.
      </p>
      <TechnicianForm />
    </>
  );
}
