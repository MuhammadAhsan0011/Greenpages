export const metadata = {
  title: "Posting Rules",
  description:
    "Guidelines and restrictions for publishing business listings and articles on Green Pages.",
  alternates: { canonical: "/legal/posting-rules" },
};

export default function PostingRulesPage() {
  return (
    <article className="legal-article">
      <h2>Posting Rules</h2>
      <p className="legal-updated">Last updated: August 27, 2026</p>

      <p>
        These rules apply to every business listing and article published on
        Green Pages. We may edit or remove content that breaks these rules
        at any time.
      </p>

      <h3>1. Accurate Information</h3>
      <p>
        Listings must use the business&apos;s real name, a working contact
        number, and an accurate category and city. Don&apos;t list a
        business you don&apos;t own or represent.
      </p>

      <h3>2. One Listing Per Business</h3>
      <p>
        Each business should have a single listing. Don&apos;t create
        duplicate or near-identical listings for the same business to
        occupy more space in search results.
      </p>

      <h3>3. Prohibited Content</h3>
      <p>The following are not allowed in listings or articles:</p>
      <ul>
        <li>Illegal goods or services under Pakistani law</li>
        <li>Fraudulent financial schemes, fake loan offers, or scams</li>
        <li>Counterfeit products or unauthorized use of trademarks/logos</li>
        <li>Adult content, hate speech, or harassment</li>
        <li>Malware, phishing links, or deceptive redirects</li>
      </ul>

      <h3>4. Article Submissions</h3>
      <p>
        Articles must be original content you wrote or have the right to
        publish — no plagiarized or AI-spun content copied from other sites.
        Articles used purely to stuff links or spam keywords will be
        removed. See our <a href="/legal/community-standards">Community Standards</a>{" "}
        for conduct rules on comments.
      </p>

      <h3>5. Plan-Based Features</h3>
      <p>
        Some features — tags, scheduled publishing, homepage featuring,
        custom SEO fields, and the rich text editor — are only available on
        Verified and Featured packages, and are enforced on our end
        regardless of what a request claims. Free-tier articles and listings
        remain fully functional without these extras.
      </p>

      <h3>6. Reporting a Listing or Article</h3>
      <p>
        If you spot content that breaks these rules, email us at{" "}
        <a href="mailto:greenpages.pk.com@gmail.com">greenpages.pk.com@gmail.com</a> with a
        link to the listing or article and a short description of the
        issue.
      </p>
    </article>
  );
}
