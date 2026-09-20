// Single source of truth for plan names/prices/periods — referenced by both
// /pricing (full marketing cards) and the business listing wizard's
// "Choose Your Plan" step, so a price change never needs updating in two
// places.
export const PLAN_PRICING = {
  free: { name: "Free", price: "Rs. 0", period: "forever" },
  verified: { name: "Verified", price: "Rs. 2,000", period: "one-time" },
  featured: { name: "Premium", price: "Rs. 4,500", period: "one-time" },
};
