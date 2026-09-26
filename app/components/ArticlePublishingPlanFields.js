import { ARTICLE_PLAN_PRICING } from "../data/plans";

// Per-article publishing plan — separate from the business listing plan
// (see app/data/plans.js's note on ARTICLE_PLAN_PRICING). Pure CSS
// selectable cards, same .plan-choice-card pattern the business listing
// wizard's "Choose Your Plan" step already uses (no client JS needed for
// the selection/highlight itself).
const PLAN_FEATURES = {
  free: ["Standard placement", "Editorial review", "1 relevant external link", "Publication after approval"],
  featured: [
    "Everything in Free",
    "Featured placement",
    "Higher category visibility",
    "Up to 2 relevant links",
    "Social promotion",
    "Faster review",
  ],
  sponsored: [
    "Everything in Featured",
    "Brand-focused article",
    "Up to 3 relevant commercial links",
    "Limited homepage exposure",
    "Priority review",
  ],
};

export default function ArticlePublishingPlanFields({ defaultPlan = "free" }) {
  return (
    <div className="plan-choice-grid">
      {Object.entries(ARTICLE_PLAN_PRICING).map(([id, plan]) => (
        <label className="plan-choice-card" key={id}>
          {id === "featured" && <span className="pricing-badge">Recommended</span>}
          <input type="radio" name="submissionPlan" value={id} defaultChecked={id === defaultPlan} />
          <span className="plan-choice-name">{plan.name}</span>
          <span className="plan-choice-price">
            {plan.originalPrice && <s className="plan-choice-original-price">{plan.originalPrice}</s>}
            {plan.price}
            <span className="plan-choice-period">{plan.period}</span>
          </span>
          <ul className="plan-choice-features">
            {PLAN_FEATURES[id].map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </label>
      ))}
    </div>
  );
}
