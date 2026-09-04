import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { upsertBusiness } from "../actions";
import { BUSINESS_CATEGORIES } from "../../data/businessCategories";
import RichTextEditor from "../../components/RichTextEditorClientOnly";
import TagInput from "../../components/TagInput";
import CharCountTextarea from "../../components/CharCountTextarea";
import ImageUploadField from "../../components/ImageUploadField";
import PhotoDropzone from "../../components/PhotoDropzone";

export const metadata = {
  title: "Add Your Business Listing",
  robots: { index: false, follow: false },
};

const categories = BUSINESS_CATEGORIES.map((category) => category.name);

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const FEATURES = [
  { value: "24/7 Service", icon: "🕐" },
  { value: "Online Booking", icon: "📅" },
  { value: "Free Wi-Fi", icon: "📶" },
  { value: "Delivery", icon: "🚚" },
  { value: "Takeaway", icon: "🥡" },
  { value: "Parking Available", icon: "🅿️" },
  { value: "Wheelchair Accessible", icon: "♿" },
  { value: "Other", icon: "⋯" },
];

const STEPS = [
  { id: "info", icon: "🏢", label: "Business Info" },
  { id: "contact", icon: "📞", label: "Contact Info" },
  { id: "location", icon: "📍", label: "Location" },
  { id: "media", icon: "🖼️", label: "Details & Media" },
  { id: "review", icon: "✅", label: "Review & Submit" },
];

function LockedNotice({ feature }) {
  return (
    <div className="locked-field" title="Upgrade your package to unlock this feature">
      <span className="locked-field-icon" aria-hidden="true">
        🔒
      </span>
      <span>
        {feature} is a Verified/Premium feature.{" "}
        <Link href="/pricing">Upgrade your package</Link> to unlock it.
      </span>
    </div>
  );
}

// Server Component — the form posts directly to a Server Action
// (upsertBusiness), so no client-side JavaScript is needed to submit it.
// The 5-step wizard is a pure-CSS radio-button widget (see .wizard-step-*
// in globals.css): "Save & Continue"/"Back" are plain <label>s pointing at
// the next/previous step's radio input, so navigating steps needs no
// JavaScript either, and every field across every step still submits
// together in one request regardless of which step is showing.
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
  const selectedFeatures = (business?.features ?? "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  const existingPhotos = (business?.photos ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="breadcrumbs">
              <Link href="/">Home</Link> / Add Listing
            </p>
            <h1>
              {business ? "Edit Your " : "Add Your "}
              <span className="text-accent">Business Listing</span>
            </h1>
            <p className="hero-description">
              List your business on Green Pages PK and connect with
              thousands of potential customers across Pakistan.
            </p>
          </div>
          <div className="hero-image hero-image-small">
            <Image
              src="/images/add-listing-photo.png"
              alt="Illustration of a small storefront with a location pin above it"
              width={424}
              height={205}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="business-profile-heading">
        <div className="container">
          <h2 id="business-profile-heading" className="visually-hidden">
            {business ? "Edit Your Business Profile" : "Create Your Business Profile"}
          </h2>

          {error && <p className="form-error">{error}</p>}

          <form action={upsertBusiness} className="wizard-form">
            {STEPS.map((step, index) => (
              <input
                key={step.id}
                type="radio"
                name="wizardStep"
                id={`step-${step.id}`}
                className="wizard-step-radio"
                defaultChecked={index === 0}
              />
            ))}

            <div className="wizard-stepper" role="tablist">
              {STEPS.map((step) => (
                <label className="wizard-step" htmlFor={`step-${step.id}`} key={step.id}>
                  <span className="wizard-step-circle" aria-hidden="true">
                    {step.icon}
                  </span>
                  <span className="wizard-step-label">{step.label}</span>
                </label>
              ))}
            </div>

            <div className="wizard-layout">
              <div className="wizard-main">
                {/* ---------- Step 1: Business Info ---------- */}
                <div className="wizard-step-panel" id="panel-info">
                  <h3>Business Information</h3>
                  <p className="wizard-panel-subtitle">Tell us about your business</p>

                  <div className="form-field">
                    <label htmlFor="name">Business Name *</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your business name"
                      defaultValue={business?.name ?? ""}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="category">Business Category *</label>
                      <select
                        id="category"
                        name="category"
                        defaultValue={business?.category ?? ""}
                        required
                      >
                        <option value="" disabled>
                          Select primary category
                        </option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label htmlFor="subcategory">Sub Category (optional)</label>
                      <input
                        id="subcategory"
                        name="subcategory"
                        type="text"
                        placeholder="e.g. Digital Marketing Agency"
                        defaultValue={business?.subcategory ?? ""}
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="description">Business Description *</label>
                    <CharCountTextarea
                      id="description"
                      name="description"
                      rows={4}
                      maxLength={1000}
                      placeholder="Describe your business, services, and what makes you unique."
                      defaultValue={business?.description ?? ""}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="tags">Business Tags</label>
                    <TagInput name="tags" defaultValue={business?.tags ?? ""} />
                  </div>

                  <div className="form-field">
                    <span className="form-field-label-standalone">Business Features</span>
                    <p className="editor-hint">Select all that apply</p>
                    <div className="feature-pill-grid">
                      {FEATURES.map((feature) => (
                        <label className="feature-pill" key={feature.value}>
                          <input
                            type="checkbox"
                            name="features"
                            value={feature.value}
                            defaultChecked={selectedFeatures.includes(feature.value)}
                          />
                          <span aria-hidden="true">{feature.icon}</span>
                          {feature.value}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-field">
                      <label>Business Logo</label>
                      {logoLocked ? (
                        <LockedNotice feature="Logo upload" />
                      ) : (
                        <div className="image-upload-box">
                          {business?.logo_url ? (
                            <div className="logo-preview-row">
                              <Image
                                src={business.logo_url}
                                alt={`${business.name} logo`}
                                width={56}
                                height={56}
                                className="logo-preview"
                              />
                              <label className="remove-logo-checkbox">
                                <input type="checkbox" name="removeLogo" value="yes" />
                                Remove
                              </label>
                            </div>
                          ) : (
                            <span className="image-upload-icon" aria-hidden="true">
                              🖼️
                            </span>
                          )}
                          <ImageUploadField name="logo" label="Upload Logo" />
                        </div>
                      )}
                    </div>
                    <div className="form-field">
                      <label>Cover Image</label>
                      {logoLocked ? (
                        <LockedNotice feature="Cover image upload" />
                      ) : (
                        <div className="image-upload-box">
                          {business?.cover_image_url ? (
                            <div className="logo-preview-row">
                              <Image
                                src={business.cover_image_url}
                                alt={`${business.name} cover`}
                                width={56}
                                height={56}
                                className="logo-preview"
                              />
                              <label className="remove-logo-checkbox">
                                <input type="checkbox" name="removeCoverImage" value="yes" />
                                Remove
                              </label>
                            </div>
                          ) : (
                            <span className="image-upload-icon" aria-hidden="true">
                              🖼️
                            </span>
                          )}
                          <ImageUploadField name="coverImage" label="Upload Cover Image" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Business Photos</label>
                    {logoLocked ? (
                      <LockedNotice feature="Photo gallery" />
                    ) : (
                      <PhotoDropzone name="photos" existingFieldName="existingPhotos" existingPhotos={existingPhotos} max={5} />
                    )}
                  </div>

                  <div className="wizard-nav-buttons">
                    <span />
                    <label htmlFor="step-contact" className="btn btn-primary">
                      Save &amp; Continue →
                    </label>
                  </div>
                </div>

                {/* ---------- Step 2: Contact Info ---------- */}
                <div className="wizard-step-panel" id="panel-contact">
                  <h3>Contact Information</h3>
                  <p className="wizard-panel-subtitle">How can customers reach you?</p>

                  <div className="form-row">
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
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="website">Website (optional)</label>
                    <input id="website" name="website" type="url" defaultValue={business?.website ?? ""} />
                  </div>

                  <div className="form-field">
                    <span className="form-field-label-standalone">Business Hours (optional)</span>
                    <div className="hours-input-list">
                      {DAYS.map((day) => {
                        const saved = business?.business_hours?.[day.key];
                        return (
                          <div className="hours-input-row" key={day.key}>
                            <span className="hours-day-label">{day.label}</span>
                            <input
                              type="time"
                              name={`hours_${day.key}_open`}
                              defaultValue={saved?.open ?? ""}
                              aria-label={`${day.label} opening time`}
                            />
                            <span aria-hidden="true">to</span>
                            <input
                              type="time"
                              name={`hours_${day.key}_close`}
                              defaultValue={saved?.close ?? ""}
                              aria-label={`${day.label} closing time`}
                            />
                            <label className="hours-closed-checkbox">
                              <input
                                type="checkbox"
                                name={`hours_${day.key}_closed`}
                                value="yes"
                                defaultChecked={saved?.closed ?? false}
                              />
                              Closed
                            </label>
                          </div>
                        );
                      })}
                    </div>
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

                  <div className="wizard-nav-buttons">
                    <label htmlFor="step-info" className="btn btn-secondary">
                      ← Back
                    </label>
                    <label htmlFor="step-location" className="btn btn-primary">
                      Save &amp; Continue →
                    </label>
                  </div>
                </div>

                {/* ---------- Step 3: Location ---------- */}
                <div className="wizard-step-panel" id="panel-location">
                  <h3>Location</h3>
                  <p className="wizard-panel-subtitle">Where can customers find you?</p>

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

                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="city">City (optional)</label>
                      <input id="city" name="city" type="text" defaultValue={business?.city ?? ""} />
                    </div>
                    <div className="form-field">
                      <label htmlFor="state">State (optional)</label>
                      <input id="state" name="state" type="text" defaultValue={business?.state ?? ""} />
                    </div>
                  </div>

                  <div className="form-row">
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
                  </div>

                  <div className="wizard-nav-buttons">
                    <label htmlFor="step-contact" className="btn btn-secondary">
                      ← Back
                    </label>
                    <label htmlFor="step-media" className="btn btn-primary">
                      Save &amp; Continue →
                    </label>
                  </div>
                </div>

                {/* ---------- Step 4: Details & Media ---------- */}
                <div className="wizard-step-panel" id="panel-media">
                  <h3>Details &amp; Media</h3>
                  <p className="wizard-panel-subtitle">Write about you and your company</p>

                  <div className="form-field">
                    {isPaidPlan ? (
                      <RichTextEditor name="about" defaultValue={business?.about_html ?? ""} />
                    ) : (
                      <LockedNotice feature="The rich About editor" />
                    )}
                  </div>

                  <div className="wizard-nav-buttons">
                    <label htmlFor="step-location" className="btn btn-secondary">
                      ← Back
                    </label>
                    <label htmlFor="step-review" className="btn btn-primary">
                      Save &amp; Continue →
                    </label>
                  </div>
                </div>

                {/* ---------- Step 5: Review & Submit ---------- */}
                <div className="wizard-step-panel" id="panel-review">
                  <h3>Review &amp; Submit</h3>
                  <p className="wizard-panel-subtitle">
                    Use the steps above to double-check everything, then submit your listing.
                  </p>
                  <div className="locked-field">
                    <span className="locked-field-icon" aria-hidden="true">
                      ✅
                    </span>
                    <span>
                      Once submitted, your listing goes live immediately on the
                      public directory — you can always come back and edit it later.
                    </span>
                  </div>

                  <div className="wizard-nav-buttons">
                    <label htmlFor="step-media" className="btn btn-secondary">
                      ← Back
                    </label>
                    <button type="submit" className="btn btn-primary">
                      {business ? "Save Changes" : "Create Business Profile"}
                    </button>
                  </div>
                </div>
              </div>

              <aside className="wizard-sidebar">
                <div className="wizard-sidebar-card">
                  <h3>
                    <span aria-hidden="true">💡</span> Tips for a Great Listing
                  </h3>
                  <ul className="wizard-tip-list">
                    <li>
                      <strong>Use your real business name.</strong> This builds trust and
                      credibility.
                    </li>
                    <li>
                      <strong>Choose the right category.</strong> Helps customers find you
                      faster.
                    </li>
                    <li>
                      <strong>Write a clear description.</strong> Explain what you do and
                      what makes you different.
                    </li>
                    <li>
                      <strong>Add high-quality images.</strong> Good visuals attract more
                      customers.
                    </li>
                    <li>
                      <strong>Keep your information accurate.</strong> Ensure customers can
                      reach you easily.
                    </li>
                  </ul>
                </div>

                <div className="wizard-sidebar-card">
                  <h3>
                    <span aria-hidden="true">⭐</span> Why List with Green Pages PK?
                  </h3>
                  <ul className="wizard-benefit-list">
                    <li>
                      <strong>Increase Visibility</strong>
                      <span>Get discovered by thousands of customers</span>
                    </li>
                    <li>
                      <strong>Build Credibility</strong>
                      <span>Verified listings build trust and confidence</span>
                    </li>
                    <li>
                      <strong>Generate Leads</strong>
                      <span>Receive more calls, inquiries, and business</span>
                    </li>
                    <li>
                      <strong>Grow Your Business</strong>
                      <span>Expand your reach and grow your brand across Pakistan</span>
                    </li>
                  </ul>
                </div>

                <div className="wizard-sidebar-card wizard-help-card">
                  <h3>
                    <span aria-hidden="true">🤝</span> Need Help?
                  </h3>
                  <p>Our support team is here to help you list your business.</p>
                  <Link href="/contact" className="btn btn-secondary btn-sm">
                    Contact Support →
                  </Link>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
