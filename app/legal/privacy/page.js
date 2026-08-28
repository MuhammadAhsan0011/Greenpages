export const metadata = {
  title: "Privacy Policy",
  description:
    "How Green Pages collects, uses, and protects your personal data across the directory and website.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="legal-article">
      <h2>Privacy Policy</h2>
      <p className="legal-updated">Last updated: August 27, 2026</p>

      <p>
        This Privacy Policy explains what information Green Pages collects,
        how we use it, and the choices you have.
      </p>

      <h3>1. Information We Collect</h3>
      <ul>
        <li>
          <strong>Account information:</strong> your name and email address
          when you sign up, handled by our authentication provider,
          Supabase.
        </li>
        <li>
          <strong>Business listing information:</strong> business name,
          category, description, website, phone number, city, and logo — all
          of which you choose to make public on the directory.
        </li>
        <li>
          <strong>Article &amp; comment content:</strong> anything you submit
          when publishing an article or leaving a comment.
        </li>
        <li>
          <strong>Contact form submissions:</strong> your name, email, and
          message when you contact us, which we receive by email.
        </li>
        <li>
          <strong>Usage data:</strong> pages visited and general usage
          patterns, collected via Google Analytics. See our{" "}
          <a href="/legal/cookies">Cookie Policy</a> for details.
        </li>
      </ul>

      <h3>2. How We Use Your Information</h3>
      <ul>
        <li>To create and manage your account</li>
        <li>To display your business listing or articles publicly, as intended by the platform</li>
        <li>To respond to contact form submissions and support requests</li>
        <li>To activate paid packages after verifying payment</li>
        <li>To understand how the site is used and improve it</li>
      </ul>

      <h3>3. Third-Party Services</h3>
      <p>We use the following third-party services to run Green Pages:</p>
      <ul>
        <li><strong>Supabase</strong> — authentication, database, and file storage (logos, cover images)</li>
        <li><strong>Vercel</strong> — website hosting</li>
        <li><strong>Google Analytics</strong> — anonymized usage analytics</li>
        <li><strong>Resend</strong> — delivering contact form emails</li>
      </ul>
      <p>
        Each of these providers processes data only as needed to provide
        their service to us, under their own privacy and security practices.
      </p>

      <h3>4. Data Retention</h3>
      <p>
        We retain your account and listing data for as long as your account
        remains active. If you delete your business listing or account, we
        remove the associated public data within a reasonable time.
      </p>

      <h3>5. Your Rights</h3>
      <p>
        You can update your business listing and article content directly
        from your account at any time. To request a copy of your data, or
        to have your account and data deleted, email us at{" "}
        <a href="mailto:greenpages.pk.com@gmail.com">greenpages.pk.com@gmail.com</a>.
      </p>

      <h3>6. Children&apos;s Privacy</h3>
      <p>
        Green Pages is intended for business owners and is not directed at
        children under 18. We do not knowingly collect data from children.
      </p>

      <h3>7. Changes to This Policy</h3>
      <p>
        We may update this Privacy Policy from time to time. Material
        changes will be reflected by updating the &quot;Last updated&quot;
        date above.
      </p>

      <h3>8. Contact</h3>
      <p>
        Questions about this policy? Email{" "}
        <a href="mailto:greenpages.pk.com@gmail.com">greenpages.pk.com@gmail.com</a> or use
        our <a href="/contact">Contact page</a>.
      </p>
    </article>
  );
}
