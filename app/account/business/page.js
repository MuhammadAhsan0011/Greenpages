import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { upsertBusiness, removeBusinessLogo } from "../actions";

export const metadata = {
  title: "Business Profile",
  robots: { index: false, follow: false },
};

const categories = [
  "Manufacturing",
  "Construction & Real Estate",
  "Industrial Machinery",
  "Healthcare & Medical",
  "IT & Software Services",
  "Textiles & Garments",
  "Packaging & Printing",
  "Agriculture & Livestock",
  "Solar & Renewable Energy",
  "Chemicals, Rubber & Plastics",
  "Automotive",
  "Electrical & Electronics",
  "Furniture & Interior Design",
  "Freight, Shipping & Logistics",
  "Food & Beverage",
  "Cosmetics & Personal Care",
  "Security & Surveillance",
  "Education & Training",
  "Hospitality & Tourism",
  "Beauty & Salons",
  "Legal Services",
  "Financial & Insurance Services",
  "Real Estate",
  "Fashion & Apparel",
  "Events & Entertainment",
  "Sports & Fitness",
  "Arts & Crafts",
  "Retail & E-Commerce",
  "Professional Services",
  "SEO",
  "Web Development",
  "Content Marketing",
  "Other",
];

// Server Component — the form posts directly to a Server Action
// (upsertBusiness), so no client-side JavaScript is needed to submit it.
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

  const logoLocked = !business || business.plan === "free";

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

      {!logoLocked && business?.logo_url && (
        <div className="logo-preview-row">
          <Image
            src={business.logo_url}
            alt={`${business.name} logo`}
            width={72}
            height={72}
            className="logo-preview"
          />
          <form action={removeBusinessLogo}>
            <button type="submit" className="btn btn-secondary btn-sm">
              Remove Logo
            </button>
          </form>
        </div>
      )}

      <form action={upsertBusiness} className="contact-form">
          <div className="form-field">
            <label htmlFor="logo">
              {business?.logo_url ? "Replace Business Logo" : "Business Logo"}
            </label>
            {logoLocked ? (
              <div
                className="locked-field"
                title="Upgrade your package to unlock this feature"
              >
                <span className="locked-field-icon" aria-hidden="true">
                  🔒
                </span>
                <span>
                  Logo upload is a Verified/Featured feature.{" "}
                  <Link href="/pricing">Upgrade your package</Link> to unlock it.
                </span>
              </div>
            ) : (
              <>
                <input id="logo" name="logo" type="file" accept="image/*" />
                <p className="editor-hint">PNG, JPEG, WebP, or GIF — max 5MB.</p>
              </>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="name">Business Name</label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={business?.name ?? ""}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              defaultValue={business?.category ?? ""}
              required
            >
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
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={5}
              defaultValue={business?.description ?? ""}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="website">Website (optional)</label>
            <input
              id="website"
              name="website"
              type="url"
              defaultValue={business?.website ?? ""}
            />
          </div>

          <div className="form-field">
            <label htmlFor="phone">Phone (optional)</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={business?.phone ?? ""}
            />
          </div>

          <div className="form-field">
            <label htmlFor="city">City (optional)</label>
            <input id="city" name="city" type="text" defaultValue={business?.city ?? ""} />
          </div>

          <button type="submit" className="btn btn-primary">
            {business ? "Save Changes" : "Create Business Profile"}
          </button>
        </form>
    </div>
  );
}
