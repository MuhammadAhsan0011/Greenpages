import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Button from "../../components/Button";
import { deleteOwnArticle } from "./actions";
import { FREE_PLAN_ARTICLE_LIMIT } from "./constants";

export const metadata = {
  title: "My Articles",
  robots: { index: false, follow: false },
};

// Server Component — the layout (app/account/layout.js) already guarantees
// a signed-in user before this renders.
export default async function MyArticlesPage({ searchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: articles } = await supabase
    .from("articles")
    .select("id, slug, title, category, created_at, approved")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const { data: business } = await supabase
    .from("businesses")
    .select("plan")
    .eq("owner_id", user.id)
    .maybeSingle();
  const isPaidPlan = business?.plan === "verified" || business?.plan === "featured";

  return (
    <>
      <h2>My Articles</h2>
      <p className="hero-description">
        Everything you&apos;ve published, newest first.
      </p>

      {params?.submitted && (
        <p className="form-success">
          Your article has been submitted and is awaiting admin approval —
          it&apos;ll go live on the blog once reviewed.
        </p>
      )}

      {!isPaidPlan && (
        <p className="editor-hint">
          Free plan: {articles?.length ?? 0} of {FREE_PLAN_ARTICLE_LIMIT} articles used.{" "}
          <Link href="/pricing">Upgrade</Link> for unlimited, admin-approval-free
          publishing.
        </p>
      )}

      {articles && articles.length > 0 ? (
        <ul className="account-article-list">
          {articles.map((article) => (
            <li key={article.slug} className="account-article-item">
              {article.approved === false ? (
                <span>
                  {article.title} <span className="locked-inline-hint">🕐 Pending Approval</span>
                </span>
              ) : (
                <Link href={`/blog/${article.slug}`}>{article.title}</Link>
              )}
              <span className="account-meta">
                <span>{article.category}</span>
                <span>
                  {new Date(article.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </span>
              <div className="account-article-actions">
                {isPaidPlan ? (
                  <Link
                    href={`/account/articles/${article.slug}/edit`}
                    className="btn btn-secondary btn-sm"
                  >
                    Edit Article
                  </Link>
                ) : (
                  <span
                    className="locked-inline-hint"
                    title="Upgrade your package to edit articles"
                  >
                    🔒 <Link href="/pricing">Upgrade to edit</Link>
                  </span>
                )}
                <form action={deleteOwnArticle.bind(null, article.id)}>
                  <button type="submit" className="btn btn-danger btn-sm">
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>You haven&apos;t published any articles yet.</p>
      )}

      <Button href="/account/articles/new" variant="primary">
        Write a New Article
      </Button>
    </>
  );
}
