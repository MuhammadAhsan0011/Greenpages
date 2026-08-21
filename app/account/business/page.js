import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { upsertBusiness } from "../actions";

export const metadata = {
  title: "Business Profile",
  robots: { index: false, follow: false },
};

const categories = [
  "SEO",
  "Web Development",
  "Content Marketing",
  "Retail",
  "Food & Beverage",
  "Professional Services",
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

      <form action={upsertBusiness} className="contact-form">
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
