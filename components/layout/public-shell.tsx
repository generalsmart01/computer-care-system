import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/features/auth/auth.actions";
import { SiteFooter } from "@/components/layout/site-footer";
export async function PublicShell({ children }: { children: React.ReactNode }) {
  const user = await getSession(),
    dashboard =
      user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
        ? "/admin"
        : user?.role === "TECHNICIAN"
          ? "/technician"
          : "/dashboard";
  const links = (
    <>
      <Link href="/services">Services</Link>
      <Link href="/about">About</Link>
      <Link href="/faq">FAQ</Link>
      <Link href="/contact">Contact</Link>
      {user ? (
        <>
          <Link className="btn" href={dashboard}>
            Dashboard
          </Link>
          <form action={logoutAction}>
            <button className="btn secondary">Log out</button>
          </form>
        </>
      ) : (
        <>
          <Link href="/login">Log in</Link>
          <Link className="btn" href="/register">
            Book a repair
          </Link>
        </>
      )}
    </>
  );
  return (
    <>
      <header className="topbar">
        <div className="container">
          <Link className="brand" href="/" aria-label="ComputerCare home">
            <span className="brand-mark" aria-hidden="true">
              C
            </span>
            <span>ComputerCare</span>
          </Link>
          <nav className="nav desktop-nav" aria-label="Main navigation">
            {links}
          </nav>
          <details className="mobile-menu">
            <summary>
              Menu<span className="sr-only">, open main navigation</span>
            </summary>
            <nav aria-label="Mobile navigation">{links}</nav>
          </details>
        </div>
      </header>
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter />
    </>
  );
}
