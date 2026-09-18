import Link from "next/link";
import { AuthForm } from "@/components/forms/auth-form";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    passwordChanged?: string;
    onboardingComplete?: string;
  }>;
}) {
  const query = await searchParams;
  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="auth-page-kicker">Welcome back</p>
        <h1>Customer login</h1>
        <p className="auth-page-description">
          Pick up where you left off with your bookings, repairs, and updates.
        </p>
        {query.passwordChanged === "1" && (
          <p className="success card" role="status">
            Your password was changed successfully. Sign in with your new
            password.
          </p>
        )}
        {query.onboardingComplete === "1" && (
          <p className="success card" role="status">
            Account setup completed. Sign in with your new password.
          </p>
        )}
        <AuthForm mode="login" />
        <div className="auth-help-links">
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href="/verify-email">Resend verification email</Link>
        </div>
        <p className="auth-switch">
          New to ComputerCare? <Link href="/register">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
