export const metadata = {
  title: "Refund Policy",
  description:
    "Refund terms for Green Pages' Verified and Featured business listing packages.",
  alternates: { canonical: "/legal/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <article className="legal-article">
      <h2>Refund Policy</h2>
      <p className="legal-updated">Last updated: August 27, 2026</p>

      <p>
        This policy covers payments for our paid listing packages, Verified
        (Rs. 2,000/year) and Featured (Rs. 4,500/year). The Free plan never
        requires payment.
      </p>

      <h3>1. How Activation Works</h3>
      <p>
        After you request an upgrade and send payment via bank transfer or
        Easypaisa to the details on our <a href="/pricing">Pricing page</a>,
        our team manually verifies the payment and activates your package —
        typically within 24 hours.
      </p>

      <h3>2. Full Refund Situations</h3>
      <p>You&apos;re entitled to a full refund if:</p>
      <ul>
        <li>You sent payment but your package was not activated within a reasonable time due to an error on our end</li>
        <li>You were charged in error or charged twice for the same upgrade</li>
      </ul>

      <h3>3. No Refund Situations</h3>
      <p>
        Once a package has been activated and delivered as described (badge,
        priority placement, and included features live on your listing),
        payments are non-refundable for that annual period. This includes
        changing your mind after activation or closing your business
        listing voluntarily.
      </p>

      <h3>4. Requesting a Refund</h3>
      <p>
        Email <a href="mailto:kimmak209@gmail.com">kimmak209@gmail.com</a>{" "}
        with your business name and payment details. We aim to respond
        within 2–3 business days and process approved refunds using the
        original payment method where possible.
      </p>
    </article>
  );
}
