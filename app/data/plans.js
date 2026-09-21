// Single source of truth for plan names/prices/periods — referenced by both
// /pricing (full marketing cards) and the business listing wizard's
// "Choose Your Plan" step, so a price change never needs updating in two
// places.
export const PLAN_PRICING = {
  free: { name: "Free", price: "Rs. 0", period: "forever" },
  verified: { name: "Verified", price: "Rs. 2,000", period: "one-time" },
  featured: { name: "Premium", price: "Rs. 4,500", period: "one-time" },
};

// Per-article publishing plan pricing — deliberately separate from the
// business listing PLAN_PRICING above. A Verified/Premium business member
// still picks a Free/Featured/Sponsored option per article; this never
// changes based on their business plan, and their business plan never
// changes based on this. See lib/seo/articleLinks.js for the link-count
// caps and rel="sponsored"/"nofollow" behavior each tier implies.
export const ARTICLE_PLAN_PRICING = {
  free: { name: "Free Article", price: "Rs. 0", period: "per article" },
  featured: { name: "Featured Article", price: "Rs. 1,500", period: "per article" },
  sponsored: { name: "Sponsored Article", price: "Rs. 3,000", period: "per article" },
};
