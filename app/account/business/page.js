import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { upsertBusiness } from "../actions";
import { BUSINESS_CATEGORIES } from "../../data/businessCategories";
import RichTextEditor from "../../components/RichTextEditorClientOnly";

export const metadata = {
  title: "Business Profile",
  robots: { index: false, follow: false },
};

const categories = BUSINESS_CATEGORIES.map((category) => category.name);

function LockedNotice({ feature }) {
  return (
    <div className="locked-field" title="Upgrade your package to unlock this feature">
      <span className="locked-field-icon" aria-hidden="true">
        🔒
      </span>
      <span>
        {feature} is a Verified/Featured feature.{" "}
        <Link href="/pricing">Upgrade your package</Link> to unlock it.
      </span>
    </div>
  );
}

// Server Component — the form posts directly to a Server Action
// (upsertBusiness), so no client-side JavaScript is needed to submit it.
// The Contact Details / Profile Photo / About tabs are a pure-CSS
// radio-button widget (see .profile-tab-* in globals.css) so switching
// tabs needs no JavaScript either, and every field still submits together
// in one request regardless of which tab is showing.
export default async function BusinessProfilePage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  const isPaidPlan = business?.plan === "verified" || business?.plan === "featured";
  const logoLocked = !business || !isPaidPlan;

  return (
    <div className="dashboard-form-wrap">
      <h1 id="business-profile-heading">
        {business ? "Edit Your Business Profile" : "Create Your Business Profile"}
      </h1>
      <p className="hero-description">
        This appears on the public{" "}
        <Link href="/businesses">business directory</Link>.
      </p>

      {error && <p className="form-error">{error}</p>}

      <form action={upsertBusiness} className="contact-form profile-tabs">
        <input
          type="radio"
          name="profileTabSelect"
          id="tab-contact"
          className="profile-tab-radio"
          defaultChecked
        />
        <input type="radio" name="profileTabSelect" id="tab-photo" className="profile-tab-radio" />
        <input type="radio" name="profileTabSelect" id="tab-about" className="profile-tab-radio" />

        <div className="profile-tab-bar" role="tablist">
          <label htmlFor="tab-contact">Contact Details</label>
          <label htmlFor="tab-photo">Profile Photo</label>
          <label htmlFor="tab-about">About</label>
        </div>

        <div className="profile-tab-panel" id="panel-contact">
          <div className="form-field">
            <label htmlFor="name">Business Name</label>
            <input id="name" name="name" type="text" defaultValue={business?.name ?? ""} required />
          </div>

          <div className="form-field">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue={business?.category ?? ""} required>
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="position">Your Position (optional)</label>
            <input
              id="position"
              name="position"
              type="text"
              placeholder="e.g. Owner, Manager"
              defaultValue={business?.position ?? ""}
            />
          </div>

          <div className="form-field">
            <label htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={business?.phone ?? ""}
              placeholder="+92 3XX XXXXXXX"
            />
            <p className="editor-hint">
              Use the same format everywhere you list this business — we
              recommend +92 3XX XXXXXXX.
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="description">Short Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={170}
              defaultValue={business?.description ?? ""}
              required
            />
            <p className="editor-hint">
              Displays under your name on search result pages — 170 character limit.
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="addressLine1">Address Line 1 (optional)</label>
            <input
              id="addressLine1"
              name="addressLine1"
              type="text"
              defaultValue={business?.address_line1 ?? ""}
            />
          </div>

          <div className="form-field">
            <label htmlFor="addressLine2">Address Line 2 (optional)</label>
            <input
              id="addressLine2"
              name="addressLine2"
              type="text"
              defaultValue={business?.address_line2 ?? ""}
            />
          </div>

          <div className="form-field">
            <label htmlFor="city">City (optional)</label>
            <input id="city" name="city" type="text" defaultValue={business?.city ?? ""} />
          </div>

          <div className="form-field">
            <label htmlFor="state">State (optional)</label>
            <input id="state" name="state" type="text" defaultValue={business?.state ?? ""} />
          </div>

          <div className="form-field">
            <label htmlFor="country">Country (optional)</label>
            <input id="country" name="country" type="text" defaultValue={business?.country ?? ""} />
          </div>

          <div className="form-field">
            <label htmlFor="postalCode">Postal Code (optional)</label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              defaultValue={business?.postal_code ?? ""}
            />
          </div>

          <div className="form-field">
            <label htmlFor="website">Website (optional)</label>
            <input id="website" name="website" type="url" defaultValue={business?.website ?? ""} />
          </div>

          <div className="account-card">
            <h2>Social Links</h2>
            {isPaidPlan ? (
              <>
                <div className="form-field">
                  <label htmlFor="facebookUrl">Facebook (optional)</label>
                  <input
                    id="facebookUrl"
                    name="facebookUrl"
                    type="url"
                    placeholder="https://facebook.com/your_page"
                    defaultValue={business?.facebook_url ?? ""}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="instagramUrl">Instagram (optional)</label>
                  <input
                    id="instagramUrl"
                    name="instagramUrl"
                    type="url"
                    placeholder="https://instagram.com/your_name"
                    defaultValue={business?.instagram_url ?? ""}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="linkedinUrl">LinkedIn (optional)</label>
                  <input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="url"
                    placeholder="https://linkedin.com/company/your_name"
                    defaultValue={business?.linkedin_url ?? ""}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="whatsappUrl">WhatsApp (optional)</label>
                  <input
                    id="whatsappUrl"
                    name="whatsappUrl"
                    type="url"
                    placeholder="https://wa.me/923XXXXXXXXX"
                    defaultValue={business?.whatsapp_url ?? ""}
                  />
                </div>
              </>
            ) : (
              <LockedNotice feature="Social links" />
            )}
          </div>
        </div>

        <div className="profile-tab-panel" id="panel-photo">
          <div className="form-field">
            <label htmlFor="logo">
              {business?.logo_url ? "Replace Business Logo" : "Business Logo"}
            </label>
            {logoLocked ? (
              <LockedNotice feature="Logo upload" />
            ) : (
              <>
                {business?.logo_url && (
                  <div className="logo-preview-row">
                    <Image
                      src={business.logo_url}
                      alt={`${business.name} logo`}
                      width={72}
                      height={72}
                      className="logo-preview"
                    />
                    <label className="remove-logo-checkbox">
                      <input type="checkbox" name="removeLogo" value="yes" />
                      Remove current logo
                    </label>
                  </div>
                )}
                <input id="logo" name="logo" type="file" accept="image/*" />
                <p className="editor-hint">PNG, JPEG, WebP, or GIF — max 5MB.</p>
              </>
            )}
          </div>
        </div>

        <div className="profile-tab-panel" id="panel-about">
          <div className="form-field">
            <label htmlFor="about">Write About You and Your Company</label>
            {isPaidPlan ? (
              <RichTextEditor name="about" defaultValue={business?.about_html ?? ""} />
            ) : (
              <LockedNotice feature="The rich About editor" />
            )}
          </div>
        </div>

        <button type="submit" className="btn btn-primary">
          {business ? "Save Changes" : "Create Business Profile"}
        </button>
      </form>
    </div>
  );
}
