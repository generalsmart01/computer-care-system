import Link from "next/link";
import { AuthForm } from "@/components/forms/auth-form";

export default async function Page({ searchParams }: { searchParams: Promise<{ onboardingComplete?: string }> }) {
  const query = await searchParams;
  return <main className="auth-page">
    <div className="auth-card">
      <p className="auth-page-kicker">Administrative access</p>
      <h1>Admin login</h1>
      <p className="auth-page-description">Sign in to manage bookings, technicians, and the ComputerCare workspace.</p>
      {query.onboardingComplete === "1" && <p className="success card" role="status">Account setup completed. Sign in with your new password.</p>}
      <AuthForm mode="login" portal="admin" />
      <div className="auth-help-links"><Link href="/forgot-password">Forgot password?</Link></div>
      <p className="auth-switch">Are you a customer? <Link href="/login">Customer login</Link></p>
    </div>
  </main>;
}
