import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { PLAN_LABELS } from "../data/plans";

export const metadata = {
  title: "My Dashboard",
  robots: { index: false, follow: false },
};

// Server Component — the layout (app/account/layout.js) already guarantees
// a signed-in user before this renders.
export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: business }] = await Promise.all([
    supabase.from("profiles").select("full_name, created_at").eq("id", user.id).single(),
    supabase.from("businesses").select("*").eq("owner_id", user.id).maybeSingle(),
  ]);

  return (
    <>
      <h2>Welcome, {profile?.full_name ?? "Member"}</h2>
      <p className="hero-description">
        Manage your business profile and publish articles — all free.
      </p>

      <div className="tile-grid">
        <Link href="/account/articles/new" className="tile">
          <span className="tile-icon" aria-hidden="true">
            ✍️
          </span>
          <span>Write an Article</span>
        </Link>
        <Link href="/account/business" className="tile">
          <span className="tile-icon" aria-hidden="true">
            🏢
          </span>
          <span>{business ? "Edit Business Profile" : "Create Business Profile"}</span>
        </Link>
      </div>

      <div className="account-card">
        <h2>Business Profile</h2>
        {business ? (
          <>
            <p className="account-meta">
              <span>{business.name}</span>
              <span>{business.category}</span>
              {business.city && <span>{business.city}</span>}
              <span>Plan: {PLAN_LABELS[business.plan]}</span>
            </p>
            {business.requested_plan && (
              <p className="form-success pricing-alert">
                Your request to upgrade to {PLAN_LABELS[business.requested_plan]} is
                pending approval. We&apos;ll contact you to arrange payment.
              </p>
            )}
            {business.plan === "free" && !business.requested_plan && (
              <p className="account-upgrade-nudge">
                <Link href="/pricing">Upgrade to Verified</Link> for a trust badge
                and priority placement, or{" "}
                <Link href="/pricing">go Premium</Link> for maximum visibility.
              </p>
            )}
            <p>{business.description}</p>
          </>
        ) : (
          <p>
            You haven&apos;t created a business profile yet.{" "}
            <Link href="/account/business">Create one now</Link>.
          </p>
        )}
      </div>

      <div className="account-card">
        <h2>Account Details</h2>
        <dl className="sidebar-meta">
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>Active — Free Member</dd>
          </div>
        </dl>
      </div>
    </>
  );
}
