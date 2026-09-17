import Link from "next/link";
import { ResendVerificationForm } from "@/components/forms/resend-verification-form";
import { verifyEmailToken } from "@/features/auth/email-verification.service";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; sent?: string }>;
}) {
  const query = await searchParams;
  if (query.token) {
    let verifiedEmail: string | undefined;
    let verificationError: string | undefined;
    try {
      verifiedEmail = (await verifyEmailToken(query.token)).email;
    } catch (error) {
      verificationError =
        error instanceof Error
          ? error.message
          : "This verification link is invalid or has expired";
    }
    if (verifiedEmail) {
      return (
        <main className="section container auth-result">
          <section className="card">
            <span className="auth-result-icon success" aria-hidden="true">
              ✓
            </span>
            <p className="eyebrow">Email verified</p>
            <h1>Your account is ready</h1>
            <p>
              Your email address has been verified. You can now sign in and
              access your customer dashboard.
            </p>
            <Link className="btn" href="/login">
              Continue to login
            </Link>
          </section>
        </main>
      );
    }
    return (
      <main className="section container auth-result">
        <section className="card">
          <span className="auth-result-icon danger" aria-hidden="true">
            !
          </span>
          <p className="eyebrow">Verification failed</p>
          <h1>Request a new link</h1>
          <p>{verificationError}</p>
          <ResendVerificationForm />
          <Link className="text-link" href="/login">
            Return to login
          </Link>
        </section>
      </main>
    );
  }
  return (
    <main className="section container auth-result">
      <section className="card">
        <span className="auth-result-icon" aria-hidden="true">
          ✉
        </span>
        <p className="eyebrow">Check your inbox</p>
        <h1>Verify your email address</h1>
        <p>
          {query.sent === "1" ? (
            <>We sent a verification link to the email address you provided.</>
          ) : (
            "Enter your email address to receive a new verification link."
          )}{" "}
          The link expires after 30 minutes.
        </p>
        <ResendVerificationForm />
        <p className="muted">
          Already verified? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
