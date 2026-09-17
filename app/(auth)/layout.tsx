import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <aside className="auth-intro" aria-label="About ComputerCare">
        <Link className="auth-brand" href="/" aria-label="ComputerCare home">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <span>ComputerCare</span>
        </Link>
        <div className="auth-intro-copy">
          <span className="auth-intro-kicker">
            A clearer way to care for your devices
          </span>
          <h2>Every repair, from first request to final handover.</h2>
          <p>
            Book with confidence, follow each milestone, and approve the work
            before it begins.
          </p>
          <div className="auth-intro-steps" aria-label="How it works">
            <span>
              <b>01</b> Tell us what needs attention
            </span>
            <span>
              <b>02</b> Review the diagnosis and quote
            </span>
            <span>
              <b>03</b> Follow the repair through collection
            </span>
          </div>
        </div>
        <p className="auth-intro-footnote">
          Care you can follow. Work you can trust.
        </p>
      </aside>
      <div className="auth-main" id="main-content" tabIndex={-1}>
        <div className="auth-mobile-brand">
          <Link href="/" aria-label="ComputerCare home">
            <span className="brand-mark" aria-hidden="true">
              C
            </span>
            <span>ComputerCare</span>
          </Link>
        </div>
        {children}
        <p className="auth-main-footer">
          Need to browse first? <Link href="/services">Explore services</Link>
        </p>
      </div>
    </div>
  );
}
