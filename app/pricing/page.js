import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { requestUpgrade } from "./actions";

const WHATSAPP_NUMBER = "923032672509";

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
    id: "free",
    name: "Free",
    icon: "💼",
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
  },
  {
    id: "verified",
    name: "Verified",
    icon: "🛡️",
    price: "Rs. 2,000",
    period: "/annually",
    description: "Stand out with a trust badge and better visibility.",
    features: [
      "Everything in Free",
      "Business logo on your listing",
      "“Verified” badge on your listing",
      "Priority placement above Free listings",
      "Higher ranking in city & category search results",
    ],
    highlight: true,
  },
  {
    id: "featured",
    name: "Featured",
    icon: "👑",
    price: "Rs. 4,500",
    period: "/annually",
    description: "Maximum visibility across the entire directory.",
    features: [
      "Everything in Verified",
      "“Featured” badge — top placement directory-wide",
      "Priority placement above Verified listings",
      "Dedicated support setting up your profile",
    ],
  },
];

const PLAN_RANK = { free: 0, verified: 1, featured: 2 };

// Server Component — reads the signed-in user's business (if any) so each
// card's call-to-action reflects their real status: not signed in, no
// business yet, current plan, a pending request, or eligible to upgrade.
export default async function PricingPage({ searchParams }) {
  const params = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let business = null;
  if (user) {
    const { data } = await supabase
      .from("businesses")
      .select("plan, requested_plan")
      .eq("owner_id", user.id)
      .maybeSingle();
    business = data;
  }

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

          {params?.requested && (
            <p className="form-success pricing-alert">
              Your upgrade request has been sent! We&apos;ll contact you to
              arrange payment and activate your package.
            </p>
          )}
          {params?.error && <p className="form-error">{params.error}</p>}

          <div className="grid grid-3 pricing-grid">
            {packages.map((pkg) => {
              const isCurrentPlan = business?.plan === pkg.id;
              const isPending = business?.requested_plan === pkg.id;
              const isDowngrade =
                business && PLAN_RANK[pkg.id] < PLAN_RANK[business.plan];

              return (
                <article
                  className={`pricing-card${pkg.highlight ? " pricing-card-highlight" : ""}`}
                  key={pkg.id}
                >
                  {pkg.highlight && (
                    <span className="pricing-badge">Most Popular</span>
                  )}
                  <span className={`pricing-icon pricing-icon-${pkg.id}`} aria-hidden="true">
                    {pkg.icon}
                  </span>
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

                  {pkg.id === "free" ? (
                    user ? (
                      <span className="btn btn-secondary pricing-cta-disabled">
                        {business ? "Your Current Plan" : "Included with Sign Up"}
                      </span>
                    ) : (
                      <Link href="/signup" className="btn btn-secondary">
                        Sign Up Free
                      </Link>
                    )
                  ) : !user ? (
                    <Link href={`/login?next=/pricing`} className="btn btn-primary">
                      Log In to Upgrade
                    </Link>
                  ) : !business ? (
                    <Link href="/account/business" className="btn btn-primary">
                      Create Business First
                    </Link>
                  ) : isCurrentPlan ? (
                    <span className="btn btn-secondary pricing-cta-disabled">
                      Your Current Plan
                    </span>
                  ) : isPending ? (
                    <span className="btn btn-secondary pricing-cta-disabled">
                      Requested — Pending Approval
                    </span>
                  ) : isDowngrade ? (
                    <span className="btn btn-secondary pricing-cta-disabled">
                      Included in Your Plan
                    </span>
                  ) : (
                    <form action={requestUpgrade.bind(null, pkg.id)}>
                      <button type="submit" className="btn btn-primary">
                        Choose {pkg.name}
                      </button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
          <p className="pricing-note">
            Verified and Featured packages are activated after payment via
            bank transfer or Easypaisa. Click a package above to send a
            request, then pay using either method below.
          </p>
        </div>
      </section>

      <section
        className="section-alt"
        aria-labelledby="payment-methods-heading"
      >
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Payment Methods</span>
            <h2 id="payment-methods-heading">
              How to Pay for Verified &amp; Featured Packages
            </h2>
            <p>
              Scan a QR code below or send the package amount directly to
              either account, then WhatsApp us your payment screenshot.
            </p>
          </div>

          <div className="grid grid-2 payment-methods-grid">
            <div className="payment-method-card">
              <div className="payment-qr">
                <Image
                  src="/images/payment-easypaisa-qr.png"
                  alt="Easypaisa QR code to send payment"
                  width={220}
                  height={220}
                />
              </div>
              <h3>Easypaisa</h3>
              <p className="payment-account-name">Muhammad Ihsan</p>
              <p className="payment-account-number">03032672509</p>
            </div>

            <div className="payment-method-card">
              <div className="payment-qr">
                <Image
                  src="/images/payment-ubl-qr.png"
                  alt="UBL Bank QR code to send payment"
                  width={220}
                  height={220}
                />
              </div>
              <h3>UBL Bank</h3>
              <p className="payment-account-name">Muhammad Ahsan</p>
              <p className="payment-account-number">0297335554913</p>
            </div>
          </div>

          <div className="payment-guide-note">
            <p>
              <strong>How it works:</strong> Pay the package amount using
              either method above, take a screenshot of your payment
              confirmation, and send it to us on WhatsApp. Our team verifies
              it and upgrades your listing within 24 hours.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.9-2-.2-.6-.5-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1 0 1.2.9 2.4 1 2.6.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.2-.3-.2-.5-.3Z"
                />
                <path
                  fill="currentColor"
                  d="M12 2.5A9.5 9.5 0 0 0 3.4 16.4L2.5 21.5l5.2-1.4A9.5 9.5 0 1 0 12 2.5Zm0 17.3a7.8 7.8 0 0 1-4-1.1l-.3-.2-3.1.8.8-3-.2-.3A7.8 7.8 0 1 1 12 19.8Z"
                />
              </svg>
              Send Payment Screenshot on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
