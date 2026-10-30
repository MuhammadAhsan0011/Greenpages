import { createPublicClient } from "@/utils/supabase/public";
import { isAdEligible, todayInKarachi } from "@/lib/ads";

const TTL_MS = 60 * 1000;

// Shared via globalThis so a server action (which clears it after an admin
// edit) and the /api/ads route see the same copy even if Next bundles them
// separately. Single Node process on cPanel, so this is enough.
function cacheStore() {
  if (!globalThis.__adConfigCache) globalThis.__adConfigCache = { at: 0, data: null };
  return globalThis.__adConfigCache;
}

export function clearAdConfigCache() {
  cacheStore().at = 0;
}

// What the browser needs to choose and render ads - and nothing else. In
// particular NOT target_url: visitors only ever get the internal
// /ad/click/<id> link, so the affiliate URL isn't sitting in page data.
//
// Shape: { slots: { [key]: { rotation, max, desktop, tablet, mobile,
//   ads: [{ id, name, image, width, height, responsive, priority, order,
//           newTab, label }] } } }
// Only enabled placements that have at least one eligible ad appear.
export async function getAdConfig() {
  const store = cacheStore();
  if (store.data && Date.now() - store.at < TTL_MS) return store.data;

  const supabase = createPublicClient();
  const [slotsResult, adsResult] = await Promise.all([
    supabase.from("ad_slots").select("*").eq("enabled", true),
    supabase
      .from("ads")
      .select(
        "id, name, ad_type, image_url, size_key, width, height, slot_key, start_date, end_date, priority, status, open_in_new_tab, created_at"
      )
      .eq("status", "active")
      .order("created_at", { ascending: true }),
  ]);

  // A failed query must not look like "no ads" - keep serving the last good
  // copy (or nothing, if there never was one) rather than blanking the site's ads.
  if (slotsResult.error || adsResult.error) {
    return store.data ?? { slots: {} };
  }

  const today = todayInKarachi();
  const slots = {};
  for (const slot of slotsResult.data ?? []) {
    slots[slot.key] = {
      rotation: slot.rotation,
      max: slot.max_ads,
      desktop: slot.show_desktop,
      tablet: slot.show_tablet,
      mobile: slot.show_mobile,
      ads: [],
    };
  }

  (adsResult.data ?? []).forEach((ad, index) => {
    const slot = slots[ad.slot_key];
    if (!slot || !isAdEligible(ad, today)) return;
    slot.ads.push({
      id: ad.id,
      name: ad.name,
      image: ad.image_url,
      width: ad.width,
      height: ad.height,
      responsive: ad.size_key === "responsive",
      priority: ad.priority,
      order: index,
      newTab: ad.open_in_new_tab,
      adType: ad.ad_type,
    });
  });

  for (const key of Object.keys(slots)) {
    if (slots[key].ads.length === 0) delete slots[key];
  }

  store.data = { slots };
  store.at = Date.now();
  return store.data;
}
