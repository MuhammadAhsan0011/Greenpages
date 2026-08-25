import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { requestUpgrade } from "./actions";

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
    period: "/month",
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
    period: "/month",
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
            bank transfer, JazzCash, or Easypaisa. Click a package above to
            send a request, and we&apos;ll reach out to arrange payment.
          </p>
        </div>
      </section>
    </>
  );
}
