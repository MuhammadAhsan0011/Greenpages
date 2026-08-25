import Link from "next/link";
import Button from "../components/Button";

export const metadata = {
  title: "Packages & Pricing",
  description:
    "Green Pages listing packages: a free business listing, or upgrade to Verified (Rs. 2,000) or Featured (Rs. 4,500) for priority placement in the Pakistan business directory.",
  alternates: {
    canonical: "/pricing",
  },
};

const packages = [
  {
    name: "Free",
    price: "Rs. 0",
    period: "forever",
    description: "Get listed in the directory and start publishing today.",
    features: [
      "Business profile listed in the directory",
      "Contact details, website & phone shown",
      "Publish unlimited articles",
      "Comment on any article",
      "Standard placement in category & search results",
    ],
    cta: { label: "Sign Up Free", href: "/signup", variant: "secondary" },
  },
  {
    name: "Verified",
    price: "Rs. 2,000",
    period: "/month",
    description: "Stand out with a trust badge and better visibility.",
    features: [
      "Everything in Free",
      "“Verified” badge on your listing",
      "Priority placement above Free listings",
      "Higher ranking in city & category search results",
    ],
    cta: { label: "Get Verified", href: "/contact?package=verified", variant: "primary" },
    highlight: true,
  },
  {
    name: "Featured",
    price: "Rs. 4,500",
    period: "/month",
    description: "Maximum visibility across the entire directory.",
    features: [
      "Everything in Verified",
      "“Featured” badge — top placement directory-wide",
      "Priority placement above Verified listings",
      "Dedicated support setting up your profile",
    ],
    cta: { label: "Get Featured", href: "/contact?package=featured", variant: "secondary" },
  },
];

// Server Component — fully static content, no client-side JavaScript needed.
export default function PricingPage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="hero-eyebrow">Packages</span>
          <h1>Simple, Transparent Pricing</h1>
          <p className="hero-description">
            Start free. Upgrade any time for a verified badge and priority
            placement in front of more customers.
          </p>
        </div>
      </section>

      <section aria-labelledby="pricing-heading">
        <div className="container">
          <h2 id="pricing-heading" className="visually-hidden">
            Packages
          </h2>
          <div className="grid grid-3 pricing-grid">
            {packages.map((pkg) => (
              <article
                className={`pricing-card${pkg.highlight ? " pricing-card-highlight" : ""}`}
                key={pkg.name}
              >
                {pkg.highlight && (
                  <span className="pricing-badge">Most Popular</span>
                )}
                <h3>{pkg.name}</h3>
                <p className="pricing-amount">
                  {pkg.price}
                  <span>{pkg.period}</span>
                </p>
                <p className="pricing-description">{pkg.description}</p>
                <ul className="pricing-features">
                  {pkg.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Button href={pkg.cta.href} variant={pkg.cta.variant}>
                  {pkg.cta.label}
                </Button>
              </article>
            ))}
          </div>
          <p className="pricing-note">
            Verified and Featured packages are activated after payment via
            bank transfer, JazzCash, or Easypaisa. Contact us and mention
            your chosen package to get started —{" "}
            <Link href="/contact">reach out here</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
