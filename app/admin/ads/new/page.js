import AdsNav from "../AdsNav";
import AdForm from "../AdForm";
import { requireAdminPage } from "../guard";
import { createAd } from "../actions";
import { todayInKarachi } from "@/lib/ads";

export const metadata = {
  title: "Add Advertisement",
  robots: { index: false, follow: false },
};

export default async function NewAdPage() {
  const { supabase } = await requireAdminPage();
  const { data: slots } = await supabase.from("ad_slots").select("key, label, description, enabled, allowed_sizes").order("sort_order");

  return (
    <section aria-labelledby="new-ad-heading">
      <div className="container">
        <h1 id="new-ad-heading">Add Advertisement</h1>
        <AdsNav active="new" />
        {slots && slots.length > 0 ? (
          <AdForm action={createAd} slots={slots} today={todayInKarachi()} />
        ) : (
          <p className="form-error">
            No placements found. Run <code>docs/seo/ads-migration.sql</code> in the Supabase SQL Editor first.
          </p>
        )}
      </div>
    </section>
  );
}
