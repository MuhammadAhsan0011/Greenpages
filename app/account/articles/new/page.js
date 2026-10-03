import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createArticle, saveArticleDraft } from "../actions";
import ArticleFormGuard from "../../../components/ArticleFormGuard";
import SubmitButton from "../../../components/SubmitButton";
import RichTextEditor from "../../../components/RichTextEditorClientOnly";
import ImageUploadField from "../../../components/ImageUploadField";
import ArticleCategoryFields from "../../../components/ArticleCategoryFields";
import ArticleTargetCityField from "../../../components/ArticleTargetCityField";
import { getAllParents, resolveCategoryNodes } from "../../../data/blog";
import {
  isPaidPlan as computeIsPaidPlan,
  PUBLISHER_PLAN_LABELS,
  getPublisherSubmissionLimit,
} from "../../../data/plans";

export const metadata = {
  title: "Write a New Article",
  robots: { index: false, follow: false },
};

// Server Component — the form posts directly to a Server Action
// (createArticle), so no client-side JavaScript is needed to submit it.
// Verified/Featured BUSINESS members' articles still publish instantly;
// everyone else's goes to pending_review — unchanged from before this
// feature existed. Author identity and the submission_plan this article
// gets are both derived from the signed-in user's business profile (one-
// time author profile + Publisher Plan) rather than re-entered per article
// — see app/account/articles/actions.js.
export default async function NewArticlePage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const submitted = params?.submitted === "1";
  const savedDraft = params?.savedDraft === "1";
  const draftId = params?.draftId?.toString().trim() || null;

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
      .select("plan, publisher_plan, name, author_bio, author_photo_url, author_phone")
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);

  // Author identity and the Publisher Plan both live on the business
  // profile — without one, there's nothing to write the article as.
  if (!business) {
    redirect(
      `/account/business?error=${encodeURIComponent(
        "Create your business profile first, then come back to write an article."
      )}`
    );
  }

  // The one-time author profile is a required first step, not an optional
  // extra — every author sets a bio before they can write their first
  // article, not just whenever they feel like it. Re-checked in
  // createArticle/saveArticleDraft too, since this page gate alone doesn't
  // stop a direct form submission.
  if (!business.author_bio) {
    redirect("/account/articles/author-profile?next=/account/articles/new");
  }

  const isPaidPlan = computeIsPaidPlan(business.plan);
  const publisherPlan = business.publisher_plan ?? "basic";
  const submissionLimit = getPublisherSubmissionLimit(publisherPlan);

  // How many real submissions this account has made within the current
  // rolling window — same query createArticle uses to enforce the cap, run
  // again here purely to display it (not to block the page).
  const windowStart = new Date(
    Date.now() - submissionLimit.windowDays * 24 * 60 * 60 * 1000
  ).toISOString();
  const { count: usedInWindow } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user.id)
    .neq("status", "draft")
    .gte("created_at", windowStart);
  const atSubmissionLimit = (usedInWindow ?? 0) >= submissionLimit.maxArticles;

  // Continuing a saved draft — ownership-checked here, never trusted from
  // the URL alone. A missing/foreign/no-longer-a-draft id just falls back
  // to a blank form instead of erroring.
  let draft = null;
  if (draftId) {
    const { data: draftRow } = await supabase
      .from("articles")
      .select("*")
      .eq("id", draftId)
      .maybeSingle();
    if (draftRow && draftRow.author_id === user.id && draftRow.status === "draft") {
      draft = draftRow;
    }
  }

  const { parent: draftParent, child: draftChild } = draft
    ? resolveCategoryNodes(draft.category)
    : { parent: null, child: null };

  if (submitted) {
    return (
      <div className="dashboard-form-wrap article-submitted-panel">
        <span className="article-submitted-icon" aria-hidden="true">
          ✅
        </span>
        <h1>Article Submitted Successfully</h1>
        <p className="hero-description">
          Your article has been submitted for editorial review. We&apos;ll
          review your content before publication.
        </p>
        <div className="hero-ctas">
          <Link href="/account/articles" className="btn btn-primary">
            View My Articles
          </Link>
          <Link href="/account" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="article-submission-page">
      <Link href="/account" className="back-to-dashboard-link">
        ← Back to Dashboard
      </Link>
      <h1 id="new-article-heading">{draft ? "Continue Your Draft" : "Create Your Article"}</h1>
      <p className="hero-description">
        Share your expertise, promote your business and reach a
        Pakistan-focused audience.
      </p>

      {error && <p className="form-error">{error}</p>}
      {savedDraft && !error && (
        <p className="form-success">
          Draft saved. Come back any time from{" "}
          <Link href="/account/articles">My Articles</Link> to finish it.
        </p>
      )}

      <div className="article-form-layout">
        <ArticleFormGuard
          action={createArticle}
          className="article-form-main"
          encType="multipart/form-data"
          hasCoverImage={Boolean(draft?.cover_image_url)}
        >
          <input type="hidden" name="draftId" value={draft?.id ?? ""} />

          <div className="account-card">
            <h2>1. Article Details</h2>

            <div className="form-field">
              <label htmlFor="title">Article Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="Enter your article title..."
                defaultValue={draft?.title ?? ""}
                required
              />
            </div>

            <ArticleCategoryFields
              parents={getAllParents()}
              defaultParentSlug={draftParent?.slug}
              defaultChildSlug={draftChild?.slug}
            />

            <ArticleTargetCityField defaultValue={draft?.target_city ?? ""} />

            <div className="form-field">
              <span className="form-field-label-standalone">
                Featured Image {draft?.cover_image_url ? "" : "*"}
              </span>
              {draft?.cover_image_url && (
                <div className="logo-preview-row">
                  <Image
                    src={draft.cover_image_url}
                    alt="Current draft cover"
                    width={120}
                    height={72}
                    className="logo-preview"
                  />
                  <span className="editor-hint">Uploading a new image below replaces this one.</span>
                </div>
              )}
              <div className="image-upload-box">
                <span className="image-upload-icon" aria-hidden="true">
                  🖼️
                </span>
                <ImageUploadField
                  name="coverImage"
                  label="Click to upload image"
                  hint="JPG, PNG (Max 5MB)"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="content">Article Content *</label>
              <RichTextEditor
                name="content"
                defaultValue={draft?.content ?? ""}
                showWordCount
                minWords={800}
                wordCountHint="Minimum 800 words | Recommended 1,000–1,800 words | Maximum 2,500 words"
              />
            </div>
          </div>

          <div className="account-card">
            <h2>2. Author Profile</h2>
            <p className="editor-hint">
              Set up once, used on every article you publish.{" "}
              <Link href="/account/articles/author-profile">Edit your author profile →</Link>
            </p>
            <div className="author-profile-summary">
              {business.author_photo_url ? (
                <Image
                  src={business.author_photo_url}
                  alt=""
                  width={56}
                  height={56}
                  className="author-profile-summary-photo"
                />
              ) : (
                <span className="author-profile-summary-photo author-profile-summary-photo-empty" aria-hidden="true">
                  {(profile?.full_name ?? "?").charAt(0).toUpperCase()}
                </span>
              )}
              <div>
                <strong>{profile?.full_name ?? "—"}</strong>
                <span className="editor-hint">{user.email}</span>
                {business.name && <span className="editor-hint">{business.name}</span>}
              </div>
            </div>
          </div>

          <div className="account-card">
            <h2>3. Publisher Plan</h2>
            <p>
              You&apos;re on the <strong>{PUBLISHER_PLAN_LABELS[publisherPlan]}</strong> Publisher
              Plan — up to {submissionLimit.maxArticles} article
              {submissionLimit.maxArticles === 1 ? "" : "s"} every {submissionLimit.windowLabel}.
            </p>
            <p className={atSubmissionLimit ? "form-error" : "editor-hint"}>
              {usedInWindow ?? 0} of {submissionLimit.maxArticles} used in the last{" "}
              {submissionLimit.windowLabel}
              {atSubmissionLimit ? " — you've reached your limit for now." : "."}
            </p>
            {publisherPlan !== "sponsored" && (
              <Link href="/pricing#publisher-plans-heading" className="service-link">
                Upgrade your Publisher Plan →
              </Link>
            )}
          </div>

          <div className="account-card">
            <h2>Declarations</h2>
            <div className="declaration-list">
              <label className="declaration-item">
                <input type="checkbox" name="confirmOriginal" value="yes" required />
                I confirm that this article is original and does not violate copyright.
              </label>
              <label className="declaration-item">
                <input type="checkbox" name="confirmPermission" value="yes" required />
                I confirm that I have permission to use all submitted images and media.
              </label>
              <label className="declaration-item">
                <input type="checkbox" name="agreeGuidelines" value="yes" required />
                I agree to Green Pages PK&apos;s{" "}
                <Link href="/legal/posting-rules">editorial guidelines</Link> and{" "}
                <Link href="/legal/posting-rules#backlink-policy">backlink policy</Link>.
              </label>
              <label className="declaration-item">
                <input type="checkbox" name="understandNoGuarantee" value="yes" required />
                I understand that submitting an article does not guarantee
                publication or backlink placement.
              </label>
            </div>
          </div>

          <div className="article-form-actions">
            <SubmitButton
              formAction={saveArticleDraft}
              formNoValidate
              data-article-action="draft"
              className="btn btn-secondary article-draft-btn"
              pendingLabel="Saving Draft…"
            >
              Save as Draft
            </SubmitButton>
            <SubmitButton
              data-article-action="submit"
              className="btn btn-primary article-submit-btn"
              pendingLabel="Submitting…"
            >
              Submit Article for Review
            </SubmitButton>
          </div>
          <p className="editor-hint">
            Saving as a draft only requires a title and category — everything
            else can be filled in later. It won&apos;t be reviewed or
            published until you submit it.
          </p>
        </ArticleFormGuard>

        <aside className="article-form-sidebar">
          <div className="wizard-sidebar-card">
            <h3>
              <span aria-hidden="true">📋</span> Article Submission Guidelines
            </h3>
            <p>
              Please follow our guidelines to ensure your article gets
              approved quickly.
            </p>
            <Link href="/legal/posting-rules">View Full Guidelines →</Link>
          </div>

          <div className="wizard-sidebar-card">
            <h3>
              <span aria-hidden="true">💡</span> Quick Tips
            </h3>
            <ul className="wizard-tip-list">
              <li>Minimum 800 words</li>
              <li>Recommended 1,000–1,800 words</li>
              <li>Use clear headings (H1, H2, H3)</li>
              <li>Add relevant images</li>
              <li>Include useful and original content</li>
              <li>Avoid excessive promotional language</li>
            </ul>
          </div>

          <div className="wizard-sidebar-card">
            <h3>
              <span aria-hidden="true">🚫</span> What We Don&apos;t Accept
            </h3>
            <ul className="wizard-tip-list">
              <li>Plagiarized or spun content</li>
              <li>Casino/gambling content</li>
              <li>Adult content</li>
              <li>Illegal products or services</li>
              <li>Fake reviews</li>
              <li>Misleading claims</li>
              <li>Hate/extremist content</li>
              <li>Excessive affiliate links</li>
              <li>Keyword stuffing</li>
            </ul>
          </div>

          <div className="wizard-sidebar-card">
            <h3>
              <span aria-hidden="true">🔗</span> Backlink Policy
            </h3>
            <p>
              External links are subject to editorial review and may be
              modified, removed, or appropriately qualified.
            </p>
            <Link href="/legal/posting-rules#backlink-policy">View Details →</Link>
          </div>

          <div className="wizard-sidebar-card">
            <h3>
              <span aria-hidden="true">🤖</span> AI-Assisted Content Policy
            </h3>
            <p>
              AI tools may be used for research, brainstorming, outlining,
              editing, or language assistance. However, the content must
              provide genuine value and meet our quality standards.
            </p>
            <Link href="/legal/posting-rules#ai-content-policy">View Details →</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
