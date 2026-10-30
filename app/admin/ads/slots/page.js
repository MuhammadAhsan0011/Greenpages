import SubmitButton from "../../../components/SubmitButton";
import AdsNav from "../AdsNav";
import MigrationNotice from "../MigrationNotice";
import { requireAdminPage } from "../guard";
import { saveSlot } from "../actions";
import { AD_ROTATIONS, AD_SIZE_OPTIONS } from "@/lib/ads";

export const metadata = {
  title: "Advertisement Placement Settings",
  robots: { index: false, follow: false },
};

// One card per placement on the site. Changing a setting here changes what the
// <AdSlot slot="..."> in the page does - no code change or redeploy needed.
export default async function AdSlotsPage({ searchParams }) {
  const params = (await searchParams) ?? {};
  const { supabase } = await requireAdminPage();

  const [{ data: slots, error }, { data: ads }] = await Promise.all([
    supabase.from("ad_slots").select("*").order("sort_order"),
    supabase.from("ads").select("slot_key, status"),
  ]);

  const activeBySlot = new Map();
  for (const ad of ads ?? []) {
    if (ad.status === "active") activeBySlot.set(ad.slot_key, (activeBySlot.get(ad.slot_key) ?? 0) + 1);
  }

  return (
    <section aria-labelledby="slots-heading">
      <div className="container">
        <h1 id="slots-heading">Placement Settings</h1>
        <p className="hero-description">
          Control where banners can appear. A placement with no eligible advertisement shows nothing and takes no space.
          Adsterra units are separate and keep their own spots.
        </p>
        <AdsNav active="slots" />

        {error ? (
          <MigrationNotice />
        ) : (
          <div className="admin-ad-slot-list">
            {(slots ?? []).map((slot) => (
              <form key={slot.key} action={saveSlot} className="account-card admin-ad-slot">
                <input type="hidden" name="key" value={slot.key} />
                <div className="admin-ad-slot-head">
                  <div>
                    <h2>{slot.label}</h2>
                    <p className="editor-hint">
                      {slot.description} · {activeBySlot.get(slot.key) ?? 0} active ad
                      {(activeBySlot.get(slot.key) ?? 0) === 1 ? "" : "s"} assigned
                    </p>
                  </div>
                  <label className="admin-ad-toggle">
                    <input type="checkbox" name="enabled" value="yes" defaultChecked={slot.enabled} /> Enabled
                  </label>
                </div>
                {params.saved === slot.key && <p className="form-success">Saved.</p>}

                <fieldset className="admin-ad-fieldset">
                  <legend>Allowed banner sizes</legend>
                  <div className="admin-ad-checks">
                    {AD_SIZE_OPTIONS.map((option) => (
                      <label key={option.value}>
                        <input
                          type="checkbox"
                          name="allowedSizes"
                          value={option.value}
                          defaultChecked={slot.allowed_sizes.includes(option.value)}
                        />{" "}
                        {option.label}
                      </label>
                    ))}
                  </div>
                  <p className="editor-hint">Tick nothing to accept any size.</p>
                </fieldset>

                <fieldset className="admin-ad-fieldset">
                  <legend>Show on</legend>
                  <div className="admin-ad-checks">
                    <label>
                      <input type="checkbox" name="showDesktop" value="yes" defaultChecked={slot.show_desktop} /> Desktop (1024px+)
                    </label>
                    <label>
                      <input type="checkbox" name="showTablet" value="yes" defaultChecked={slot.show_tablet} /> Tablet (768–1023px)
                    </label>
                    <label>
                      <input type="checkbox" name="showMobile" value="yes" defaultChecked={slot.show_mobile} /> Mobile (under 768px)
                    </label>
                  </div>
                </fieldset>

                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor={`max-${slot.key}`}>Maximum advertisements at once</label>
                    <input id={`max-${slot.key}`} name="maxAds" type="number" min="1" max="6" defaultValue={slot.max_ads} />
                  </div>
                  <div className="form-field">
                    <label htmlFor={`rotation-${slot.key}`}>Rotation &amp; priority</label>
                    <select id={`rotation-${slot.key}`} name="rotation" defaultValue={slot.rotation}>
                      {AD_ROTATIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <SubmitButton className="btn btn-primary admin-btn-sm" pendingLabel="Saving…">
                  Save placement
                </SubmitButton>
              </form>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
