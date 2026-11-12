import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "../../ads/guard";
import { isUuid } from "@/lib/ads";
import SubmitButton from "../../../components/SubmitButton";
import RichArticleBody from "../../../components/RichArticleBody";
import SanitizedArticleBody from "../../../components/SanitizedArticleBody";
import { approveArticle, rejectArticle, requestArticleChanges } from "../../actions";

export const metadata = {
  title: "Review article",
  robots: { index: false, follow: false },
};

const STATUS_LABELS = {
  draft: "Draft",
  pending_review: "Pending Review",
  changes_requested: "Changes Requested",
  rejected: "Rejected",
  published: "Published",
};

function formatDate(value) {
  return value
    ? new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—";
}

// Where the admin READS a submission before approving it. A pending article is
// not public (its /blog/<slug> link 404s for everyone), so this is the only
// place to see the full text, the declared links and the author's details.
export default async function AdminArticleReviewPage({ params }) {
  const { supabase } = await requireAdminPage();
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { data: article } = await supabase
    .from("articles")
    .select("*, profiles(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!article) notFound();

  const status = article.status ?? (article.approved ? "published" : "pending_review");
  const canDecide = status !== "published";
  const wordCount = (article.content ?? "").replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;

  const details = [
    ["Status", STATUS_LABELS[status] ?? status],
    ["Submitted", formatDate(article.created_at)],
    ["Author (byline)", article.author_name || article.profiles?.full_name || "—"],
    ["Account name", article.profiles?.full_name ?? "—"],
    ["Email", article.author_email ?? "—"],
    ["Phone", article.author_phone ?? "—"],
    ["Company", article.company_name ?? "—"],
    ["Category", article.category],
    ["Target city", article.target_city ?? "—"],
    ["Plan", article.submission_plan ?? "free"],
    ["Links in article", article.link_count ?? 0],
    ["Length", `${wordCount} words`],
  ];

  return (
    <section>
      <div className="container">
        <p>
          <Link href="/admin">← Back to admin</Link>
        </p>
        <h1>{article.title}</h1>

        <div className="account-card">
          <h2>Details</h2>
          <dl className="admin-article-details">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {(article.website_url || article.target_url) && (
            <p>
              <strong>Website / declared link: </strong>
              <a href={article.target_url || article.website_url} target="_blank" rel="noopener noreferrer nofollow">
                {article.anchor_text || article.target_url || article.website_url}
              </a>{" "}
              ({article.target_url || article.website_url})
            </p>
          )}
          {article.business_name && (
            <p>
              <strong>Business: </strong>
              {article.business_name}
            </p>
          )}
          {article.rejection_reason && (
            <p>
              <strong>Rejection reason given: </strong>
              {article.rejection_reason}
            </p>
          )}
          {article.admin_notes && (
            <p>
              <strong>Changes requested: </strong>
              {article.admin_notes}
            </p>
          )}
        </div>

        {canDecide && (
          <div className="account-card">
            <h2>Decision</h2>
            <div className="admin-table-actions">
              <form action={approveArticle.bind(null, article.id)}>
                <SubmitButton className="btn btn-primary admin-btn-sm" pendingLabel="Approving…">
                  Approve &amp; publish
                </SubmitButton>
              </form>
              <form action={requestArticleChanges} className="admin-inline-form">
                <input type="hidden" name="articleId" value={article.id} />
                <input type="text" name="note" placeholder="What needs changing?" />
                <SubmitButton className="btn btn-secondary admin-btn-sm" pendingLabel="Sending…">
                  Request Changes
                </SubmitButton>
              </form>
              <form action={rejectArticle} className="admin-inline-form">
                <input type="hidden" name="articleId" value={article.id} />
                <input type="text" name="reason" placeholder="Reason (optional)" />
                <SubmitButton className="btn btn-danger admin-btn-sm" pendingLabel="Rejecting…">
                  Reject
                </SubmitButton>
              </form>
            </div>
          </div>
        )}

        <div className="account-card">
          <h2>Article</h2>
          {article.cover_image_url && (
            <div className="article-cover-image">
              <Image
                src={article.cover_image_url}
                alt={`Cover image for ${article.title}`}
                fill
                sizes="(max-width: 900px) 100vw, 800px"
              />
            </div>
          )}
          <article className="service-section">
            {article.content_format === "html" ? (
              <SanitizedArticleBody html={article.content} />
            ) : (
              <RichArticleBody content={article.content} />
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
