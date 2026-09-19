import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "ComputerCare", template: "%s | ComputerCare" },
  description:
    "Book trusted computer diagnostics and repairs, approve transparent quotations, and track every milestone.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
