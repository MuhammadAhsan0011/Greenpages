import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createArticle } from "../actions";
import ArticleEditor from "../../../components/ArticleEditor";
import RichTextEditor from "../../../components/RichTextEditorClientOnly";

export const metadata = {
  title: "Write a New Article",
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

// Server Component — the form posts directly to a Server Action
// (createArticle), so no client-side JavaScript is needed to submit it.
// Published instantly on submit, with no review step.
export default async function NewArticlePage({ searchParams }) {
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
    .select("plan")
    .eq("owner_id", user.id)
    .maybeSingle();
  const isPaidPlan = business?.plan === "verified" || business?.plan === "featured";

  const FREE_PLAN_ARTICLE_LIMIT = 5;
  let articleCount = 0;
  if (!isPaidPlan) {
    const { count } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id);
    articleCount = count ?? 0;
  }
  const atFreeLimit = !isPaidPlan && articleCount >= FREE_PLAN_ARTICLE_LIMIT;

  // Defaults the datetime-local input to "right now" in a format it accepts.
  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  if (atFreeLimit) {
    return (
      <div className="dashboard-form-wrap">
        <h1>Free Plan Article Limit Reached</h1>
        <div className="locked-field" title="Upgrade your package to unlock this feature">
          <span className="locked-field-icon" aria-hidden="true">
            🔒
          </span>
          <span>
            Free plan is limited to {FREE_PLAN_ARTICLE_LIMIT} articles.{" "}
            <Link href="/pricing">Upgrade to Silver or Gold</Link> for
            unlimited articles.
          </span>
        </div>
        <p className="hero-description">
          <Link href="/account/articles">Back to My Articles</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-form-wrap">
      <h1 id="new-article-heading">Write a New Article</h1>
      <p className="hero-description">
        {isPaidPlan
          ? "Your article publishes at the time you choose below, and appears on the blog and its category page."
          : "Your article publishes immediately and appears on the blog and its category page as soon as you submit it."}
      </p>

      {!isPaidPlan && (
        <p className="editor-hint">
          Free plan: {articleCount} of {FREE_PLAN_ARTICLE_LIMIT} articles used.
        </p>
      )}

      {error && <p className="form-error">{error}</p>}

      <form action={createArticle} className="contact-form">
          <div className="form-field">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" type="text" required />
          </div>

          <div className="form-field">
            <label htmlFor="coverImage">Cover Image (optional)</label>
            <input id="coverImage" name="coverImage" type="file" accept="image/*" />
            <p className="editor-hint">PNG, JPEG, WebP, or GIF — max 5MB.</p>
          </div>

          <div className="form-field">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue="" required>
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
              placeholder="A one to two sentence summary shown on the blog listing."
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="content">Article Content</label>
            {isPaidPlan ? (
              <RichTextEditor />
            ) : (
              <>
                <ArticleEditor />
                <p className="editor-hint">
                  Leave a blank line between paragraphs. Start a line with{" "}
                  <code>## </code> for a heading or <code>- </code> for a
                  bullet list.
                </p>
              </>
            )}
          </div>

          {isPaidPlan ? (
            <div className="account-card">
              <h2>Silver/Gold Options</h2>

              <div className="form-field">
                <label htmlFor="tags">Tags (comma-separated, optional)</label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  placeholder="e.g. seo, small business, marketing tips"
                />
              </div>

              <div className="form-field">
                <label htmlFor="publishedAt">Publish Date &amp; Time</label>
                <input
                  id="publishedAt"
                  name="publishedAt"
                  type="datetime-local"
                  defaultValue={nowLocal}
                />
                <p className="editor-hint">
                  Set a future date to schedule this article — it stays
                  hidden until then.
                </p>
              </div>

              <div className="form-field">
                <label htmlFor="featuredOnHomepage">Featured on Homepage?</label>
                <select id="featuredOnHomepage" name="featuredOnHomepage" defaultValue="no">
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
                  placeholder="Overrides the default SEO title for this article"
                />
              </div>

              <div className="form-field">
                <label htmlFor="metaDescription">
                  Custom Meta Description (optional)
                </label>
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  rows={2}
                  placeholder="Overrides the default SEO description for this article"
                />
              </div>
            </div>
          ) : (
            <p className="editor-hint">
              <Link href="/pricing">Upgrade to Silver or Gold</Link> to
              unlock tags, scheduled publishing, homepage featuring, and
              custom SEO fields for your articles.
            </p>
          )}

        <button type="submit" className="btn btn-primary">
          Publish Article
        </button>
      </form>
    </div>
  );
}
