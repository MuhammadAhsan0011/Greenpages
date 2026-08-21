import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AccountSidebar from "../components/AccountSidebar";

export const metadata = {
  robots: { index: false, follow: false },
};

// Server Component — this layout is the single auth gate for every
// /account/* route: it redirects to /login if there's no session, and
// fetches the profile/business data the sidebar needs once, shared across
// every page nested under it.
export default async function AccountLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: business }] = await Promise.all([
    supabase.from("profiles").select("full_name, created_at").eq("id", user.id).single(),
    supabase.from("businesses").select("name").eq("owner_id", user.id).maybeSingle(),
  ]);

  return (
    <section aria-labelledby="dashboard-heading">
      <div className="container">
        <h1 id="dashboard-heading" className="visually-hidden">
          My Account
        </h1>
        <div className="dashboard-shell">
          <AccountSidebar user={user} profile={profile} business={business} />
          <div className="dashboard-content">{children}</div>
        </div>
      </div>
    </section>
  );
}
