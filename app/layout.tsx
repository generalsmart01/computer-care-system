import "./globals.css";
export const metadata = {
  title: { default: "ComputerCare", template: "%s | ComputerCare" },
  description:
    "Book trusted computer diagnostics and repairs, approve transparent quotations, and track every milestone.",
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
