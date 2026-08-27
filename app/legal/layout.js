import LegalSidebar from "../components/LegalSidebar";

// Server Component — shared shell for every /legal/* page. LegalSidebar is
// the one small Client Component island inside it (needs usePathname() to
// highlight the active page); everything else here stays static.
export default function LegalLayout({ children }) {
  return (
    <section aria-labelledby="legal-heading">
      <div className="container">
        <h1 id="legal-heading" className="visually-hidden">
          Policies
        </h1>
        <div className="dashboard-shell">
          <LegalSidebar />
          <div className="dashboard-content legal-content">{children}</div>
        </div>
      </div>
    </section>
  );
}
