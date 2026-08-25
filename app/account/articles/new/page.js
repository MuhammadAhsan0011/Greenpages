import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createArticle } from "../actions";
import ArticleEditor from "../../../components/ArticleEditor";

export const metadata = {
  title: "Write a New Article",
  robots: { index: false, follow: false },
};

const categories = ["SEO", "Web Development", "Content Marketing"];

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

  return (
    <div className="dashboard-form-wrap">
      <h1 id="new-article-heading">Write a New Article</h1>
      <p className="hero-description">
        Your article publishes immediately and appears on the blog and
        its category page as soon as you submit it.
      </p>

      {error && <p className="form-error">{error}</p>}

      <form action={createArticle} className="contact-form">
          <div className="form-field">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" type="text" required />
          </div>

          <div className="form-field">
            <label htmlFor="coverImage">Cover Image (optional)</label>
            <input id="coverImage" name="coverImage" type="file" accept="image/*" />
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
            <ArticleEditor />
            <p className="editor-hint">
              Leave a blank line between paragraphs. Start a line with{" "}
              <code>## </code> for a heading or <code>- </code> for a
              bullet list.
            </p>
          </div>

        <button type="submit" className="btn btn-primary">
          Publish Article
        </button>
      </form>
    </div>
  );
}
