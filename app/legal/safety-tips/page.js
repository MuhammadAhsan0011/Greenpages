export const metadata = {
  title: "Safety Tips",
  description:
    "How to safely evaluate and contact businesses found on the Green Pages directory.",
  alternates: { canonical: "/legal/safety-tips" },
};

export default function SafetyTipsPage() {
  return (
    <article className="legal-article">
      <h2>Safety Tips</h2>
      <p className="legal-updated">Last updated: August 27, 2026</p>

      <p>
        Green Pages lists businesses so customers can find them — we
        don&apos;t process transactions between you and a listed business.
        A few tips for dealing with any business you find here (or
        anywhere):
      </p>

      <h3>1. Verify Independently</h3>
      <p>
        Before making a payment or commitment, verify the business&apos;s
        contact details, physical address, and reputation independently —
        a phone call, a visit, or a quick search goes a long way.
      </p>

      <h3>2. A Badge Is a Signal, Not a Guarantee</h3>
      <p>
        &quot;Verified&quot; and &quot;Featured&quot; badges mean the
        business has purchased a paid listing package — they are not a
        certification of quality, and don&apos;t replace your own due
        diligence.
      </p>

      <h3>3. Be Cautious of Red Flags</h3>
      <ul>
        <li>Prices that seem too good to be true</li>
        <li>Pressure to pay immediately or through unusual methods</li>
        <li>Requests for sensitive information (CNIC, OTPs, full card details) over chat</li>
        <li>No verifiable physical location or business history</li>
      </ul>

      <h3>4. Paying Green Pages Directly</h3>
      <p>
        If you&apos;re upgrading your own listing, only send payment to the
        official bank/Easypaisa details listed on our{" "}
        <a href="/pricing">Pricing page</a>. We will never ask you to pay
        through any other account or contact.
      </p>

      <h3>5. Report Suspicious Listings</h3>
      <p>
        If a listing looks fraudulent or misleading, report it to{" "}
        <a href="mailto:kimmak209@gmail.com">kimmak209@gmail.com</a> so we
        can review and, if needed, remove it under our{" "}
        <a href="/legal/posting-rules">Posting Rules</a>.
      </p>
    </article>
  );
}
