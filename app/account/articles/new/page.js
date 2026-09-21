import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createArticle } from "../actions";
import { FREE_PLAN_ARTICLE_LIMIT } from "../constants";
import SubmitButton from "../../../components/SubmitButton";
import RichTextEditor from "../../../components/RichTextEditorClientOnly";
import ImageUploadField from "../../../components/ImageUploadField";
import SmartTextarea from "../../../components/SmartTextarea";
import ArticleCategoryFields from "../../../components/ArticleCategoryFields";
import ArticleTargetCityField from "../../../components/ArticleTargetCityField";
import ArticlePublishingPlanFields from "../../../components/ArticlePublishingPlanFields";
import { getAllParents } from "../../../data/blog";

export const metadata = {
  title: "Write a New Article",
  robots: { index: false, follow: false },
};

// Server Component — the form posts directly to a Server Action
// (createArticle), so no client-side JavaScript is needed to submit it.
// Verified/Featured BUSINESS members' articles still publish instantly;
// everyone else's goes to pending_review — unchanged from before this
// feature existed. submission_plan (Free/Featured/Sponsored, chosen below)
// is a separate, additive per-article choice that never changes that rule
// — see app/account/articles/actions.js.
export default async function NewArticlePage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;
  const submitted = params?.submitted === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: business }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("businesses").select("plan, name, website").eq("owner_id", user.id).maybeSingle(),
  ]);

  const isPaidPlan = business?.plan === "verified" || business?.plan === "featured";

  let articleCount = 0;
  if (!isPaidPlan) {
    const { count } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id);
    articleCount = count ?? 0;
  }
  const atFreeLimit = !isPaidPlan && articleCount >= FREE_PLAN_ARTICLE_LIMIT;

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
            <Link href="/pricing">Upgrade to Verified or Premium</Link> for
            unlimited articles.
          </span>
        </div>
        <p className="hero-description">
          <Link href="/account/articles">Back to My Articles</Link>
        </p>
      </div>
    );
  }

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
      <h1 id="new-article-heading">Create Your Article</h1>
      <p className="hero-description">
        Share your expertise, promote your business and reach a
        Pakistan-focused audience.
      </p>

      {!isPaidPlan && (
        <p className="editor-hint">
          Free plan: {articleCount} of {FREE_PLAN_ARTICLE_LIMIT} articles used.
        </p>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="article-form-layout">
        <form
          action={createArticle}
          className="article-form-main"
          encType="multipart/form-data"
        >
          <div className="account-card">
            <h2>1. Article Details</h2>

            <div className="form-field">
              <label htmlFor="title">Article Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="Enter your article title..."
                required
              />
            </div>

            <ArticleCategoryFields parents={getAllParents()} />

            <ArticleTargetCityField />

            <div className="form-field">
              <span className="form-field-label-standalone">Featured Image *</span>
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
                showWordCount
                minWords={800}
                wordCountHint="Minimum 800 words | Recommended 1,000–1,800 words | Maximum 2,500 words"
              />
            </div>

            <div className="form-field">
              <label htmlFor="imageCredit">Image Source / Credit</label>
              <input
                id="imageCredit"
                name="imageCredit"
                type="text"
                placeholder="e.g. Unsplash, Pexels or your website"
              />
            </div>
          </div>

          <div className="account-card">
            <h2>2. Author Information</h2>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="authorName">Full Name *</label>
                <input
                  id="authorName"
                  name="authorName"
                  type="text"
                  defaultValue={profile?.full_name ?? ""}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="authorEmail">Email *</label>
                <input
                  id="authorEmail"
                  name="authorEmail"
                  type="email"
                  defaultValue={user.email ?? ""}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="authorPhone">Phone / WhatsApp</label>
                <input id="authorPhone" name="authorPhone" type="tel" placeholder="+92 3XX XXXXXXX" />
              </div>
              <div className="form-field">
                <label htmlFor="companyName">Company / Organization</label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  defaultValue={business?.name ?? ""}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="authorBio">Author Bio</label>
              <SmartTextarea
                id="authorBio"
                name="authorBio"
                rows={3}
                placeholder="A short bio shown alongside your article."
              />
            </div>

            <div className="form-field">
              <span className="form-field-label-standalone">Profile Photo</span>
              <div className="image-upload-box">
                <span className="image-upload-icon" aria-hidden="true">
                  🖼️
                </span>
                <ImageUploadField name="authorPhoto" label="Click to upload photo" hint="JPG, PNG (Max 5MB)" />
              </div>
            </div>
          </div>

          <div className="account-card">
            <h2>3. Website / Link Information</h2>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="websiteUrl">Website URL</label>
                <input
                  id="websiteUrl"
                  name="websiteUrl"
                  type="url"
                  defaultValue={business?.website ?? ""}
                  placeholder="https://example.com"
                />
              </div>
              <div className="form-field">
                <label htmlFor="businessName">Business Name</label>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  defaultValue={business?.name ?? ""}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="anchorText">Preferred Anchor Text</label>
                <input id="anchorText" name="anchorText" type="text" />
              </div>
              <div className="form-field">
                <label htmlFor="targetUrl">Target URL</label>
                <input id="targetUrl" name="targetUrl" type="url" placeholder="https://example.com/page" />
              </div>
            </div>
            <p className="editor-hint">
              External links are subject to editorial review and may be
              modified, removed, or appropriately qualified — see our{" "}
              <Link href="/legal/posting-rules#backlink-policy">Backlink Policy</Link>.
            </p>
          </div>

          <div className="account-card">
            <h2>4. Choose Publishing Option</h2>
            <ArticlePublishingPlanFields defaultPlan="free" />
            <p className="editor-hint">
              Featured and Sponsored fees are confirmed the same way as
              business package upgrades — see{" "}
              <Link href="/pricing#payment-methods-heading">payment methods</Link>.
              No payment is required for the Free option.
            </p>
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

          <SubmitButton className="btn btn-primary article-submit-btn" pendingLabel="Submitting…">
            Submit Article for Review
          </SubmitButton>
        </form>

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
