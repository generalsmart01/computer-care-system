import Link from "next/link";
import { humanize, statusTone } from "@/lib/presentation";

export function PageHeader({ eyebrow, title, description, actionHref, actionLabel }: { eyebrow?: string; title: string; description?: string; actionHref?: string; actionLabel?: string }) {
  return <header className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{actionHref && actionLabel && <Link className="btn" href={actionHref}>{actionLabel}</Link>}</header>;
}
export function StatusBadge({ value }: { value: string }) { return <span className={`status status-${statusTone(value)}`}>{humanize(value)}</span>; }
export function StatCard({ label, value, helper, tone = "teal" }: { label: string; value: React.ReactNode; helper?: string; tone?: "teal" | "blue" | "amber" | "violet" }) {
  return <article className={`metric-card metric-${tone}`}><span className="metric-icon" aria-hidden="true"/><div><p>{label}</p><strong>{value}</strong>{helper && <small>{helper}</small>}</div></article>;
}
export function EmptyState({ title, message, actionHref, actionLabel }: { title: string; message: string; actionHref?: string; actionLabel?: string }) {
  return <section className="empty-state"><span aria-hidden="true">◇</span><h2>{title}</h2><p>{message}</p>{actionHref && actionLabel && <Link className="btn" href={actionHref}>{actionLabel}</Link>}</section>;
}
export function SectionHeader({ title, href, linkLabel = "View all" }: { title: string; href?: string; linkLabel?: string }) {
  return <div className="section-header"><h2>{title}</h2>{href && <Link href={href}>{linkLabel} <span aria-hidden="true">→</span></Link>}</div>;
}
