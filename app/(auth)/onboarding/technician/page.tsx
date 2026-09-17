import { TechnicianOnboardingForm } from "@/components/forms/technician-onboarding-form";
import { inspectTechnicianInvitation } from "@/features/auth/email-verification.service";

export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token || "";
  const invitation = await inspectTechnicianInvitation(token);
  return (
    <main className="section container auth-result">
      <section className="card technician-onboarding">
        <span className="auth-result-icon" aria-hidden="true">
          ◇
        </span>
        <p className="eyebrow">Technician onboarding</p>
        <h1>
          {invitation
            ? `Welcome, ${invitation.firstName}`
            : "Invitation unavailable"}
        </h1>
        {invitation ? (
          <>
            <p>
              Your secure invitation verifies your email ownership. Create your
              password to activate your technician account.
            </p>
            <TechnicianOnboardingForm token={token} />
          </>
        ) : (
          <p>
            This invitation link is invalid, expired, or has already been used.
            Ask an administrator to create a new invitation.
          </p>
        )}
      </section>
    </main>
  );
}
