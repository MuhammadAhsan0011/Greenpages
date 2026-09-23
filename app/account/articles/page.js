import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Button from "../../components/Button";
import { deleteOwnArticle } from "./actions";
import { FREE_PLAN_ARTICLE_LIMIT } from "./constants";
import SubmitButton from "../../components/SubmitButton";
import { isPaidPlan as computeIsPaidPlan } from "../../data/plans";

export const metadata = {
  title: "My Articles",
  robots: { index: false, follow: false },
};

// Falls back to deriving a status from the older `approved` boolean for any
// row that predates the article-submission migration (docs/seo/
// article-submission-migration.sql backfills this on existing rows, but a
// pending Supabase migration shouldn't crash the page in the meantime).
const STATUS_LABELS = {
  pending_review: { icon: "🕐", label: "Pending Review" },
  changes_requested: { icon: "✏️", label: "Changes Requested" },
  rejected: { icon: "❌", label: "Rejected" },
  published: { icon: "✅", label: "Published" },
  unpublished: { icon: "⏸️", label: "Unpublished" },
};

function statusFor(article) {
  return STATUS_LABELS[article.status] ?? (article.approved ? STATUS_LABELS.published : STATUS_LABELS.pending_review);
}

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
    .select(
      "id, slug, title, category, created_at, approved, status, submission_plan, payment_status, rejection_reason, admin_notes"
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const { data: business } = await supabase
    .from("businesses")
    .select("plan")
    .eq("owner_id", user.id)
    .maybeSingle();
  const isPaidPlan = computeIsPaidPlan(business?.plan);

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
          {articles.map((article) => {
            const status = statusFor(article);
            const isLive = (article.status ?? (article.approved ? "published" : "pending_review")) === "published";
            return (
            <li key={article.slug} className="account-article-item">
              {isLive ? (
                <Link href={`/blog/${article.slug}`}>{article.title}</Link>
              ) : (
                <span>{article.title}</span>
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
                <span className="locked-inline-hint">
                  {status.icon} {status.label}
                </span>
                {article.submission_plan && article.submission_plan !== "free" && (
                  <span className="locked-inline-hint">
                    {article.submission_plan === "featured" ? "Featured" : "Sponsored"} —{" "}
                    {article.payment_status === "confirmed" ? "Payment confirmed" : "Payment pending"}
                  </span>
                )}
              </span>
              {article.status === "rejected" && article.rejection_reason && (
                <p className="form-error">Rejected: {article.rejection_reason}</p>
              )}
              {article.status === "changes_requested" && article.admin_notes && (
                <p className="editor-hint">Requested changes: {article.admin_notes}</p>
              )}
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
                  <SubmitButton className="btn btn-danger btn-sm" pendingLabel="Deleting…">
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </li>
            );
          })}
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
