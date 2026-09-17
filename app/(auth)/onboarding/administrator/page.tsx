import { AdministratorOnboardingForm } from "@/components/forms/administrator-onboarding-form";
import { inspectAdministratorInvitation } from "@/features/auth/email-verification.service";

export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token || "",
    invitation = await inspectAdministratorInvitation(token);
  return (
    <main className="section container auth-result">
      <section className="card technician-onboarding">
        <span className="auth-result-icon" aria-hidden="true">
          ◇
        </span>
        <p className="eyebrow">Administrator onboarding</p>
        <h1>
          {invitation
            ? `Welcome, ${invitation.firstName}`
            : "Invitation unavailable"}
        </h1>
        {invitation ? (
          <>
            <p>
              Your secure invitation verifies your email ownership. Create your
              password to activate your administrator account.
            </p>
            <AdministratorOnboardingForm token={token} />
          </>
        ) : (
          <p>
            This invitation link is invalid, expired, or already used. Ask the
            super administrator for a new invitation.
          </p>
        )}
      </section>
    </main>
  );
}
