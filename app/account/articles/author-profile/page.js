import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { updateAuthorProfile } from "../actions";
import SubmitButton from "../../../components/SubmitButton";
import ImageUploadField from "../../../components/ImageUploadField";
import SmartTextarea from "../../../components/SmartTextarea";

export const metadata = {
  title: "Author Profile",
  robots: { index: false, follow: false },
};

// Server Component — one-time author identity (bio/photo/phone) reused on
// every article from here on (see getAuthorContext in
// app/account/articles/actions.js), instead of being re-typed per
// submission. Name/email come from the account itself (profiles.full_name,
// the signed-in email) and aren't editable here.
export default async function AuthorProfilePage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const saved = params?.saved === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: business }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("businesses")
      .select("name, author_bio, author_photo_url, author_phone")
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);

  if (!business) {
    redirect(
      `/account/business?error=${encodeURIComponent(
        "Create your business profile first, then set up your author profile."
      )}`
    );
  }

  return (
    <div className="dashboard-form-wrap">
      <Link href="/account/articles/new" className="back-to-dashboard-link">
        ← Back to Article
      </Link>
      <h1>Author Profile</h1>
      <p className="hero-description">
        Set this up once — it&apos;s shown alongside every article you
        publish, instead of being re-entered each time.
      </p>

      {error && <p className="form-error">{error}</p>}
      {saved && !error && <p className="form-success">Author profile saved.</p>}

      <form action={updateAuthorProfile} className="contact-form" encType="multipart/form-data">
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="displayName">Full Name</label>
            <input id="displayName" type="text" defaultValue={profile?.full_name ?? ""} disabled />
            <p className="editor-hint">From your account — change it in your account settings.</p>
          </div>
          <div className="form-field">
            <label htmlFor="displayEmail">Email</label>
            <input id="displayEmail" type="email" defaultValue={user.email ?? ""} disabled />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="authorPhone">Phone / WhatsApp</label>
          <input
            id="authorPhone"
            name="authorPhone"
            type="tel"
            placeholder="+92 3XX XXXXXXX"
            defaultValue={business.author_phone ?? ""}
          />
        </div>

        <div className="form-field">
          <label htmlFor="authorBio">Author Bio</label>
          <SmartTextarea
            id="authorBio"
            name="authorBio"
            rows={4}
            placeholder="A short bio shown alongside your articles."
            defaultValue={business.author_bio ?? ""}
          />
        </div>

        <div className="form-field">
          <span className="form-field-label-standalone">Profile Photo</span>
          {business.author_photo_url && (
            <div className="logo-preview-row">
              <Image
                src={business.author_photo_url}
                alt="Current author photo"
                width={72}
                height={72}
                className="logo-preview"
              />
              <label className="declaration-item">
                <input type="checkbox" name="removePhoto" value="yes" />
                Remove photo
              </label>
            </div>
          )}
          <div className="image-upload-box">
            <span className="image-upload-icon" aria-hidden="true">
              🖼️
            </span>
            <ImageUploadField name="authorPhoto" label="Click to upload photo" hint="JPG, PNG (Max 5MB)" />
          </div>
        </div>

        <SubmitButton className="btn btn-primary" pendingLabel="Saving…">
          Save Author Profile
        </SubmitButton>
      </form>
    </div>
  );
}
