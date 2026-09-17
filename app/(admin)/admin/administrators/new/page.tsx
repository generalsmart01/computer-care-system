import Link from "next/link";
import { requireSuperAdmin } from "@/lib/permissions";
import { AdministratorForm } from "@/components/forms/administrator-form";
import { PageHeader } from "@/components/ui/dashboard-ui";

export default async function Page() {
  await requireSuperAdmin();
  return (
    <>
      <PageHeader
        eyebrow="Access control"
        title="Create administrator"
        description="The new administrator will verify their email and create their own password from a secure invitation."
      />
      <AdministratorForm />
      <p>
        <Link href="/admin/administrators">← Back to administrators</Link>
      </p>
    </>
  );
}
