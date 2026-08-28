import Link from "next/link";

export const metadata = {
  title: "FAQ & Support",
  description:
    "Answers to common questions about listing your business, publishing articles, and upgrading your Green Pages package.",
  alternates: { canonical: "/legal/faq" },
};

const FAQS = [
  {
    q: "How do I list my business for free?",
    a: (
      <>
        <Link href="/signup">Create a free account</Link>, then go to{" "}
        <Link href="/account/business">Business Profile</Link> to add your
        business details. Your listing goes live immediately.
      </>
    ),
  },
  {
    q: "How do I upgrade to Silver or Gold?",
    a: (
      <>
        Choose a package on the <Link href="/pricing">Pricing page</Link>{" "}
        while signed in. We&apos;ll send your upgrade request, and you send
        payment via bank transfer or Easypaisa using the details shown
        there.
      </>
    ),
  },
  {
    q: "How long does activation take after I pay?",
    a: "Our team verifies payment manually and activates your package, typically within 24 hours. See our WhatsApp option on the Pricing page for the fastest confirmation.",
  },
  {
    q: "Can I edit my business listing or articles later?",
    a: (
      <>
        Yes. Edit your listing anytime from{" "}
        <Link href="/account/business">Business Profile</Link>. Editing a
        published article is a Silver/Gold feature, available from{" "}
        <Link href="/account/articles">My Articles</Link>.
      </>
    ),
  },
  {
    q: "Who can comment on articles?",
    a: "Any signed-up member can comment on any published article, subject to our Community Standards.",
  },
  {
    q: "How do I delete my account or data?",
    a: (
      <>
        Email us at{" "}
        <a href="mailto:greenpages.pk.com@gmail.com">greenpages.pk.com@gmail.com</a> and
        we&apos;ll remove your account and associated public data.
      </>
    ),
  },
  {
    q: "Who do I contact for support?",
    a: (
      <>
        Use our <Link href="/contact">Contact page</Link>, email{" "}
        <a href="mailto:greenpages.pk.com@gmail.com">greenpages.pk.com@gmail.com</a>, or
        WhatsApp us directly from the Pricing page.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <article className="legal-article">
      <h2>FAQ &amp; Support</h2>
      <p className="legal-updated">Last updated: August 27, 2026</p>

      <div className="faq-list">
        {FAQS.map((item) => (
          <div className="faq-item" key={item.q}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
