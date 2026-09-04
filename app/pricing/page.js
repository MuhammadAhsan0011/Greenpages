import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { requestUpgrade } from "./actions";

const WHATSAPP_NUMBER = "923032672509";

export const metadata = {
  title: "Packages & Pricing",
  description:
    "Green Pages listing packages: a free business listing, or upgrade to Verified (Rs. 2,000) or Premium (Rs. 4,500) for priority placement in the Pakistan business directory.",
  alternates: {
    canonical: "/pricing",
  },
};

const packages = [
  {
    id: "free",
    name: "Free",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 12h18" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4ade80"
          d="M12 1.5l2.3 1.9 2.9-.9 1.1 2.8 2.9 1.1-.4 3.1 2 2.5-2 2.5.4 3.1-2.9 1.1-1.1 2.8-2.9-.9L12 22.5l-2.3-1.9-2.9.9-1.1-2.8-2.9-1.1.4-3.1-2-2.5 2-2.5-.4-3.1 2.9-1.1 1.1-2.8 2.9.9L12 1.5Z"
        />
        <path
          d="M7.8 12.3l2.6 2.6 5.4-6.2"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
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
    name: "Premium",
    icon: (
      <Image src="/images/premium-plan-icon.png" alt="" width={28} height={23} aria-hidden="true" />
    ),
    price: "Rs. 4,500",
    period: "/annually",
    description: "Maximum visibility across the entire directory.",
    features: [
      "Everything in Verified",
      "“Premium” badge — top placement directory-wide",
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
      <section className="hero pricing-hero">
        <div className="container">
          <span className="hero-eyebrow">Pricing Plans</span>
          <h1>
            Simple, Transparent <span className="text-accent">Pricing</span>
          </h1>
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
            Verified and Premium packages are activated after payment via
            bank transfer or Easypaisa. Click a package above to send a
            request, then pay using either method below.
          </p>

          <div className="help-banner">
            <div className="help-banner-content">
              <span className="help-banner-tag">Not Sure?</span>
              <h2>Need Help Choosing the Right Plan?</h2>
              <p>
                Our team is here to help you find the perfect plan for your
                business goals.
              </p>
            </div>
            <div className="help-banner-contacts">
              <a href="tel:+923032672509" className="help-banner-contact">
                <span className="help-banner-contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="help-banner-contact-text">
                  <span>Call Us</span>
                  <strong>+92 303 2672509</strong>
                </span>
              </a>
              <a href="mailto:greenpages.pk.com@gmail.com" className="help-banner-contact">
                <span className="help-banner-contact-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="help-banner-contact-text">
                  <span>Email Us</span>
                  <strong>greenpages.pk.com@gmail.com</strong>
                </span>
              </a>
            </div>
          </div>
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
              How to Pay for Verified &amp; Premium Packages
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
