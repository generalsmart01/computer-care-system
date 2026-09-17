import Link from "next/link";
import { AuthForm } from "@/components/forms/auth-form";
export default function Page() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="auth-page-kicker">Get started</p>
        <h1>Create your account</h1>
        <p className="auth-page-description">
          Set up your customer account to book repairs and track every update.
        </p>
        <div className="auth-info-note">
          <span aria-hidden="true">✉</span>
          <p>
            We’ll email you a verification link before your first login. Check
            that your address is correct.
          </p>
        </div>
        <AuthForm mode="register" />
        <p className="auth-switch">
          Already registered? <Link href="/login">Log in</Link>
        </p>
        <p className="auth-secondary-link">
          Missing your verification email?{" "}
          <Link href="/verify-email">Send another link</Link>
        </p>
      </div>
    </main>
  );
}
