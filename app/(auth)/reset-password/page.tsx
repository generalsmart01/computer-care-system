import Link from "next/link";

export default function Page() {
  return (
    <main className="auth-page">
      <section className="auth-card auth-support-card">
        <span className="auth-result-icon danger" aria-hidden="true">
          !
        </span>
        <p className="auth-page-kicker">Password reset</p>
        <h1>Reset link unavailable</h1>
        <p className="auth-page-description">
          A valid password-reset link is required, and self-service reset is not
          available yet. Please contact support for a secure recovery option.
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
