import Link from "next/link";

export default function Page() {
  return (
    <main className="auth-page">
      <section className="auth-card auth-support-card">
        <span className="auth-result-icon" aria-hidden="true">
          ⌁
        </span>
        <p className="auth-page-kicker">Account recovery</p>
        <h1>Need help signing in?</h1>
        <p className="auth-page-description">
          Self-service password reset is not available yet. Please contact
          support so we can verify your account securely before helping you
          regain access.
        </p>
        <Link className="btn auth-submit" href="/contact">
          Contact support
        </Link>
        <p className="auth-switch">
          <Link href="/login">Back to login</Link>
        </p>
      </section>
    </main>
  );
}
