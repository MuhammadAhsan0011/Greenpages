import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Button from "../../components/Button";

export const metadata = {
  title: "My Articles",
  robots: { index: false, follow: false },
};

// Server Component — the layout (app/account/layout.js) already guarantees
// a signed-in user before this renders.
export default async function MyArticlesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, category, created_at")
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

      {articles && articles.length > 0 ? (
        <ul className="account-article-list">
          {articles.map((article) => (
            <li key={article.slug} className="account-article-item">
              <Link href={`/blog/${article.slug}`}>{article.title}</Link>
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
