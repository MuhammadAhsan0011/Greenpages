export const metadata = {
  title: "Terms & Conditions",
  description:
    "The terms that govern using Green Pages' business directory, digital marketing services, and user-submitted articles.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <article className="legal-article">
      <h2>Terms &amp; Conditions</h2>
      <p className="legal-updated">Last updated: August 27, 2026</p>

      <p>
        These Terms &amp; Conditions (&quot;Terms&quot;) govern your use of
        Green Pages (&quot;we&quot;, &quot;us&quot;, &quot;the platform&quot;),
        including our business directory, digital marketing services, blog,
        and any account you create. By using Green Pages, you agree to these
        Terms.
      </p>

      <h3>1. What Green Pages Is</h3>
      <p>
        Green Pages is a Pakistan-focused business directory and digital
        marketing agency. Businesses can create a free listing, purchase a
        Verified or Premium package for added visibility, publish articles,
        and comment on published content. We separately offer SEO, web
        development, and content marketing services.
      </p>

      <h3>2. Accounts</h3>
      <p>
        You must provide accurate information when creating an account and
        keep your login credentials confidential. You are responsible for
        all activity under your account. We may suspend or remove accounts
        that violate these Terms or our{" "}
        <a href="/legal/posting-rules">Posting Rules</a>.
      </p>

      <h3>3. Business Listings &amp; Articles</h3>
      <p>
        When you create a business listing or publish an article, you
        confirm the information is accurate and that you have the right to
        publish it. Articles are published instantly with no manual review
        step, which means you are solely responsible for content you submit.
        We may remove any listing or article that violates our{" "}
        <a href="/legal/posting-rules">Posting Rules</a> or{" "}
        <a href="/legal/community-standards">Community Standards</a> at any
        time, without prior notice.
      </p>
      <p>
        You retain ownership of content you submit, but grant Green Pages a
        non-exclusive, royalty-free license to display it on the platform
        (including on category and city directory pages) for as long as your
        account or listing remains active.
      </p>

      <h3>4. Paid Packages (Verified &amp; Premium)</h3>
      <p>
        Verified and Premium are paid, prepaid annual upgrades to a business
        listing. Payment is made manually via bank transfer or Easypaisa
        using the account details on our{" "}
        <a href="/pricing">Pricing page</a>, and your package is activated by
        our team after we confirm receipt of payment — typically within 24
        hours. See our <a href="/legal/refund-policy">Refund Policy</a> for
        details on cancellations and refunds.
      </p>

      <h3>5. Prohibited Use</h3>
      <p>You may not use Green Pages to:</p>
      <ul>
        <li>List a business that does not exist or that you are not authorized to represent</li>
        <li>Publish false, misleading, or fraudulent information</li>
        <li>Attempt to disrupt, overload, or gain unauthorized access to the platform</li>
        <li>Violate any applicable Pakistani law</li>
      </ul>

      <h3>6. Limitation of Liability</h3>
      <p>
        Green Pages is provided &quot;as is.&quot; We do not guarantee the
        accuracy of listings created by third-party businesses, and we are
        not a party to any transaction between a directory user and a listed
        business. To the maximum extent permitted by law, Green Pages is not
        liable for indirect or consequential damages arising from your use
        of the platform.
      </p>

      <h3>7. Changes to These Terms</h3>
      <p>
        We may update these Terms from time to time. Continued use of Green
        Pages after a change means you accept the updated Terms.
      </p>

      <h3>8. Governing Law</h3>
      <p>These Terms are governed by the laws of Pakistan.</p>

      <h3>9. Contact</h3>
      <p>
        Questions about these Terms? Reach us at{" "}
        <a href="mailto:greenpages.pk.com@gmail.com">greenpages.pk.com@gmail.com</a> or via
        our <a href="/contact">Contact page</a>.
      </p>
    </article>
  );
}
