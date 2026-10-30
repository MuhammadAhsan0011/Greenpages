import { notFound } from "next/navigation";
import AdsNav from "../../AdsNav";
import AdForm from "../../AdForm";
import { requireAdminPage } from "../../guard";
import { updateAd } from "../../actions";
import { isUuid, todayInKarachi } from "@/lib/ads";

export const metadata = {
  title: "Edit Advertisement",
  robots: { index: false, follow: false },
};

export default async function EditAdPage({ params }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { supabase } = await requireAdminPage();
  const [{ data: ad }, { data: slots }] = await Promise.all([
    supabase.from("ads").select("*").eq("id", id).maybeSingle(),
    supabase.from("ad_slots").select("key, label, description, enabled, allowed_sizes").order("sort_order"),
  ]);
  if (!ad) notFound();

  return (
    <section aria-labelledby="edit-ad-heading">
      <div className="container">
        <h1 id="edit-ad-heading">Edit Advertisement</h1>
        <AdsNav active="ads" />
        <AdForm action={updateAd.bind(null, ad.id)} slots={slots ?? []} ad={ad} today={todayInKarachi()} />
      </div>
    </section>
  );
}
