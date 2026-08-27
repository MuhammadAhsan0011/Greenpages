import Image from "next/image";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { updateArticle, removeArticleCoverImage } from "../../actions";
import RichTextEditor from "../../../../components/RichTextEditorClientOnly";

export const metadata = {
  title: "Edit Article",
  robots: { index: false, follow: false },
};

const categories = [
  "SEO",
  "Web Development",
  "Content Marketing",
  "Accounting",
  "Business",
  "Online",
  "Marketing",
  "Technology",
  "Services",
];

// Server Component — editing a published article is a Verified/Featured
// perk (server-enforced in actions.js, not just hidden here). Free-plan
// owners land on a locked message instead of the form.
export default async function EditArticlePage({ params, searchParams }) {
  const { slug } = await params;
  const search = await searchParams;
  const error = search?.error;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!article || article.author_id !== user.id) {
    notFound();
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("plan")
    .eq("owner_id", user.id)
    .maybeSingle();
  const isPaidPlan = business?.plan === "verified" || business?.plan === "featured";

  if (!isPaidPlan) {
    return (
      <div className="dashboard-form-wrap">
        <h1>Editing is a Verified/Featured Feature</h1>
        <div className="locked-field" title="Upgrade your package to unlock this feature">
          <span className="locked-field-icon" aria-hidden="true">
            🔒
          </span>
          <span>
            Editing a published article requires the Verified or Featured
            package. <Link href="/pricing">Upgrade your package</Link> to
            unlock it.
          </span>
        </div>
        <p className="hero-description">
          <Link href="/account/articles">Back to My Articles</Link>
        </p>
      </div>
    );
  }

  const publishedLocal = article.published_at
    ? new Date(
        new Date(article.published_at).getTime() -
          new Date().getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16)
    : "";

  return (
    <div className="dashboard-form-wrap">
      <h1 id="edit-article-heading">Edit Article</h1>
      <p className="hero-description">
        Changes save immediately and update the live article at{" "}
        <Link href={`/blog/${article.slug}`}>/blog/{article.slug}</Link>.
      </p>

      {error && <p className="form-error">{error}</p>}

      {article.cover_image_url && (
        <div className="logo-preview-row">
          <Image
            src={article.cover_image_url}
            alt={`${article.title} cover`}
            width={120}
            height={72}
            className="logo-preview"
          />
          <form action={removeArticleCoverImage.bind(null, article.slug)}>
            <button type="submit" className="btn btn-secondary btn-sm">
              Remove Cover Image
            </button>
          </form>
        </div>
      )}

      <form action={updateArticle.bind(null, article.slug)} className="contact-form">
        <div className="form-field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" defaultValue={article.title} required />
        </div>

        <div className="form-field">
          <label htmlFor="coverImage">
            {article.cover_image_url ? "Replace Cover Image" : "Cover Image (optional)"}
          </label>
          <input id="coverImage" name="coverImage" type="file" accept="image/*" />
          <p className="editor-hint">PNG, JPEG, WebP, or GIF — max 5MB.</p>
        </div>

        <div className="form-field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={article.category} required>
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
          <label htmlFor="excerpt">Short Excerpt</label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={2}
            defaultValue={article.excerpt}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="content">Article Content</label>
          <RichTextEditor defaultValue={article.content} />
        </div>

        <div className="account-card">
          <h2>Verified/Featured Options</h2>

          <div className="form-field">
            <label htmlFor="tags">Tags (comma-separated, optional)</label>
            <input
              id="tags"
              name="tags"
              type="text"
              defaultValue={article.tags ?? ""}
              placeholder="e.g. seo, small business, marketing tips"
            />
          </div>

          <div className="form-field">
            <label htmlFor="publishedAt">Publish Date &amp; Time</label>
            <input
              id="publishedAt"
              name="publishedAt"
              type="datetime-local"
              defaultValue={publishedLocal}
            />
            <p className="editor-hint">
              Set a future date to schedule this article — it stays hidden
              until then.
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="featuredOnHomepage">Featured on Homepage?</label>
            <select
              id="featuredOnHomepage"
              name="featuredOnHomepage"
              defaultValue={article.featured_on_homepage ? "yes" : "no"}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="metaTitle">Custom Meta Title (optional)</label>
            <input
              id="metaTitle"
              name="metaTitle"
              type="text"
              defaultValue={article.meta_title ?? ""}
              placeholder="Overrides the default SEO title for this article"
            />
          </div>

          <div className="form-field">
            <label htmlFor="metaDescription">Custom Meta Description (optional)</label>
            <textarea
              id="metaDescription"
              name="metaDescription"
              rows={2}
              defaultValue={article.meta_description ?? ""}
              placeholder="Overrides the default SEO description for this article"
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary">
          Save Changes
        </button>
      </form>
    </div>
  );
}
