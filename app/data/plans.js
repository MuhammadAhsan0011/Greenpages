// Single source of truth for business listing plan names/prices/ranking/
// capabilities — referenced by /pricing (marketing cards + comparison
// table), the business listing wizard's "Choose Your Plan" step and its
// upload gating, every directory/homepage listing sort, /admin, and the
// public listing card/detail components. A price, label, or capability
// change never needs updating in more than one place.
export const PLAN_PRICING = {
  free: { name: "Basic", price: "Rs. 0", period: "forever" },
  verified: { name: "Verified", price: "Rs. 2,000", period: "one-time" },
  featured: { name: "Premium", price: "Rs. 4,500", period: "one-time" },
};

export const PLAN_IDS = Object.keys(PLAN_PRICING);

export const PLAN_LABELS = Object.fromEntries(
  Object.entries(PLAN_PRICING).map(([id, p]) => [id, p.name])
);

// Cascading placement rank used by every directory/category/city/homepage
// sort — Premium listings surface above Verified, which surface above
// Basic. Lower number = higher priority. An unrecognized plan value falls
// back to the same rank as Basic at each call site (`PLAN_RANK[plan] ?? 2`).
export const PLAN_RANK = { featured: 0, verified: 1, free: 2 };

export const PLAN_TAGLINE = {
  free: "Get Listed",
  verified: "Build Trust",
  featured: "Get More Visibility",
};

// Gallery photo cap per plan — enforced both here (wizard UI/hints) and
// server-side in app/account/actions.js's upsertBusiness.
export const PHOTO_LIMITS = { free: 1, verified: 3, featured: 8 };

// What each plan actually unlocks — the practical difference buyers are
// paying for, not just a price/badge. Enforced server-side in
// app/account/actions.js, not just hidden in the UI.
export const PLAN_CAPABILITIES = {
  free: {
    logo: true,
    coverImage: false,
    socialLinks: false,
    aboutEditor: false,
    verifiedBadge: false,
    featured: false,
    priority: false,
    homepageFeatured: false,
  },
  verified: {
    logo: true,
    coverImage: true,
    socialLinks: true,
    aboutEditor: true,
    verifiedBadge: true,
    featured: false,
    priority: true,
    homepageFeatured: false,
  },
  featured: {
    logo: true,
    coverImage: true,
    socialLinks: true,
    aboutEditor: true,
    verifiedBadge: false,
    featured: true,
    priority: true,
    homepageFeatured: true,
  },
};

export function isPaidPlan(plan) {
  return plan === "verified" || plan === "featured";
}

export function getPlanCapabilities(plan) {
  return PLAN_CAPABILITIES[plan] ?? PLAN_CAPABILITIES.free;
}

export function getPhotoLimit(plan) {
  return PHOTO_LIMITS[plan] ?? PHOTO_LIMITS.free;
}

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
