// Shown instead of a crash when the ads tables haven't been created yet.
export default function MigrationNotice() {
  return (
    <div className="account-card">
      <h2>One-time setup needed</h2>
      <p>
        The advertisement tables don&apos;t exist yet. Run <code>docs/seo/ads-migration.sql</code> once in the
        Supabase SQL Editor, then reload this page.
      </p>
    </div>
  );
}
