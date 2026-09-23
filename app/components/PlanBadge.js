import Image from "next/image";
import { PLAN_LABELS } from "../data/plans";

// Shared icon + label for a business's plan tier — reused across the
// directory cards, business detail page, and homepage featured section so
// the icon and wording stay in sync in one place instead of being
// duplicated (and drifting) in each component. `iconOnly` drops the text
// label for tight inline spots (e.g. right next to a listing's name) while
// keeping the plan announced to screen readers via aria-label — except for
// Basic, which has no icon of its own, so an icon-only spot renders nothing
// for it rather than an empty/odd-looking pill (unchanged from before this
// badge existed for Basic at all).
export default function PlanBadge({ plan, className = "", iconOnly = false }) {
  const label = PLAN_LABELS[plan] ?? PLAN_LABELS.free;
  const isBasic = plan !== "verified" && plan !== "featured";

  if (iconOnly && isBasic) {
    return null;
  }

  const classes = `plan-badge plan-badge-${plan}${iconOnly ? " plan-badge-icon-only" : ""} ${className}`.trim();

  return (
    <span className={classes} {...(iconOnly ? { title: `${label} listing`, "aria-label": `${label} listing` } : {})}>
      {plan === "featured" ? (
        <Image src="/images/premium-plan-icon.png" alt="" width={13} height={11} />
      ) : plan === "verified" ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4ade80"
            d="M12 1.5l2.3 1.9 2.9-.9 1.1 2.8 2.9 1.1-.4 3.1 2 2.5-2 2.5.4 3.1-2.9 1.1-1.1 2.8-2.9-.9L12 22.5l-2.3-1.9-2.9.9-1.1-2.8-2.9-1.1.4-3.1-2-2.5 2-2.5-.4-3.1 2.9-1.1 1.1-2.8 2.9.9L12 1.5Z"
          />
          <path
            d="M7.8 12.3l2.6 2.6 5.4-6.2"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
      {!iconOnly && (isBasic ? `${label} Listing` : label)}
    </span>
  );
}
