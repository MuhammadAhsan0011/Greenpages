import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { approveUpgrade, dismissRequest, setPlan } from "./actions";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const PLAN_LABELS = { free: "Free", verified: "Verified", featured: "Featured" };

// Server Component, gated to the single admin account (ADMIN_EMAIL). This
// is where package upgrade requests from /pricing get approved, and where
// any business's plan can be corrected manually.
export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, phone, city, plan, requested_plan, profiles(full_name)")
    .order("name", { ascending: true });

  const pending = (businesses ?? []).filter((b) => b.requested_plan);

  return (
    <section aria-labelledby="admin-heading">
      <div className="container">
        <h1 id="admin-heading">Admin</h1>
        <p className="hero-description">
          Approve package upgrade requests and manage listing plans.
        </p>

        <div className="account-card">
          <h2>Pending Upgrade Requests ({pending.length})</h2>
          {pending.length === 0 ? (
            <p>No pending requests right now.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Business</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Current</th>
                    <th scope="col">Requested</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((business) => (
                    <tr key={business.id}>
                      <td>{business.name}</td>
                      <td>{business.profiles?.full_name ?? "—"}</td>
                      <td>{business.phone ?? "—"}</td>
                      <td>{PLAN_LABELS[business.plan]}</td>
                      <td>{PLAN_LABELS[business.requested_plan]}</td>
                      <td className="admin-table-actions">
                        <form
                          action={approveUpgrade.bind(
                            null,
                            business.id,
                            business.requested_plan
                          )}
                        >
                          <button type="submit" className="btn btn-primary admin-btn-sm">
                            Approve
                          </button>
                        </form>
                        <form action={dismissRequest.bind(null, business.id)}>
                          <button type="submit" className="btn btn-secondary admin-btn-sm">
                            Dismiss
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="account-card">
          <h2>All Businesses ({businesses?.length ?? 0})</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Business</th>
                  <th scope="col">Owner</th>
                  <th scope="col">City</th>
                  <th scope="col">Plan</th>
                  <th scope="col">Set Plan</th>
                </tr>
              </thead>
              <tbody>
                {(businesses ?? []).map((business) => (
                  <tr key={business.id}>
                    <td>{business.name}</td>
                    <td>{business.profiles?.full_name ?? "—"}</td>
                    <td>{business.city ?? "—"}</td>
                    <td>{PLAN_LABELS[business.plan]}</td>
                    <td>
                      <form action={setPlan} className="admin-inline-form">
                        <input type="hidden" name="businessId" value={business.id} />
                        <select name="plan" defaultValue={business.plan}>
                          <option value="free">Free</option>
                          <option value="verified">Verified</option>
                          <option value="featured">Featured</option>
                        </select>
                        <button type="submit" className="btn btn-secondary admin-btn-sm">
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
