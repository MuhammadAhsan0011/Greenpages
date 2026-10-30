// Shared rules for the Advertisement Manager (own affiliate/sponsored banners,
// separate from the Adsterra units). Pure functions only - used by the admin
// forms/actions, the /api/ads + /ad/click routes, and the browser-side AdSlot.

export const AD_SIZES = {
  leaderboard: { label: "Leaderboard", width: 728, height: 90 },
  "medium-rectangle": { label: "Medium Rectangle", width: 300, height: 250 },
  "large-rectangle": { label: "Large Rectangle", width: 336, height: 280 },
  "mobile-banner": { label: "Mobile Banner", width: 320, height: 100 },
  "wide-skyscraper": { label: "Wide Skyscraper", width: 160, height: 600 },
  skyscraper: { label: "Skyscraper", width: 120, height: 600 },
  billboard: { label: "Billboard", width: 970, height: 250 },
  square: { label: "Square", width: 300, height: 300 },
};

// "responsive" takes the image's own dimensions and scales down to fit;
// "custom" uses whatever width/height the admin types in.
export const AD_SIZE_OPTIONS = [
  ...Object.entries(AD_SIZES).map(([value, size]) => ({
    value,
    label: `${size.label} (${size.width} × ${size.height})`,
  })),
  { value: "responsive", label: "Responsive (auto)" },
  { value: "custom", label: "Custom size" },
];

export function adSizeLabel(sizeKey, width, height) {
  if (AD_SIZES[sizeKey]) return `${AD_SIZES[sizeKey].label} · ${width}×${height}`;
  if (sizeKey === "responsive") return `Responsive · ${width}×${height}`;
  return `Custom · ${width}×${height}`;
}

export const AD_TYPES = [
  { value: "affiliate", label: "Affiliate" },
  { value: "sponsored", label: "Sponsored" },
  { value: "house", label: "House (own promotion)" },
];

// The small label shown on the banner so visitors can tell paid promotion
// from editorial content.
export function adDisclosureLabel(adType) {
  return adType === "house" ? "Advertisement" : "Sponsored";
}

export const ALLOWED_AD_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_AD_IMAGE_BYTES = 2 * 1024 * 1024;
// How far an uploaded image's proportions may drift from the chosen size
// before it would look stretched.
export const AD_ASPECT_TOLERANCE = 0.05;
// Rotation modes - keep in step with the ad_slots check constraint.
export const AD_ROTATIONS = [
  { value: "priority", label: "Rotate - higher priority shown more often" },
  { value: "random", label: "Rotate - all ads equally" },
  { value: "off", label: "No rotation - highest priority only" },
];

// Pakistan calendar date (YYYY-MM-DD). Start/expiry dates are entered and
// read in local time, so "today" has to be too (the server clock is UTC).
export function todayInKarachi(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(now);
}

export function isAdEligible(ad, today = todayInKarachi()) {
  if (ad.status !== "active") return false;
  if (ad.start_date && ad.start_date > today) return false;
  if (ad.end_date && ad.end_date < today) return false;
  return true;
}

// Where an ad stands today, for the admin table.
export function adLifecycle(ad, today = todayInKarachi()) {
  if (ad.status !== "active") return "inactive";
  if (ad.end_date && ad.end_date < today) return "expired";
  if (ad.start_date && ad.start_date > today) return "scheduled";
  return "live";
}

// The affiliate URL is only ever followed server-side from the database, but
// it's validated on save anyway: plain http(s), no embedded credentials.
export function isSafeTargetUrl(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > 2000) return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
}

export function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// Crawlers and link checkers shouldn't inflate impression/click counts.
const BOT_PATTERN = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python-requests/i;
export function isLikelyBot(userAgent) {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

export function deviceBucket(viewportWidth) {
  if (viewportWidth < 768) return "mobile";
  if (viewportWidth < 1024) return "tablet";
  return "desktop";
}

export function ctr(impressions, clicks) {
  if (!impressions) return 0;
  return (clicks / impressions) * 100;
}

export function formatCtr(impressions, clicks) {
  return `${ctr(impressions, clicks).toFixed(2)}%`;
}

// `slot` is one entry of /api/ads' response:
//   { rotation, max, desktop, tablet, mobile, ads: [{ id, width, height, responsive, priority, order }] }
// Decides what a visitor on this device actually sees:
//   1. the placement must be switched on for this device;
//   2. an ad must fit the space available (so a 728px leaderboard never shows
//      on a phone, a 320px mobile banner is preferred over nothing there);
//   3. among those that fit, only the widest size class is used (desktop gets
//      the 728 banner even if a 320 one exists in the same placement);
//   4. rotation: none (highest priority), priority-weighted, or random,
//      without repeating the ad shown last time when there is a choice.
export function selectAds(slot, { device, availableWidth, lastShownId = null, random = Math.random }) {
  if (!slot || !slot[device]) return [];

  const fits = (slot.ads ?? []).filter((ad) => ad.responsive || ad.width <= availableWidth + 1);
  if (fits.length === 0) return [];

  const widest = Math.max(...fits.map((ad) => ad.width));
  const tier = fits.filter((ad) => ad.width >= widest * 0.75);
  const max = Math.min(Math.max(slot.max ?? 1, 1), tier.length);

  if (slot.rotation === "off") {
    return [...tier]
      .sort((a, b) => b.priority - a.priority || (a.order ?? 0) - (b.order ?? 0))
      .slice(0, max);
  }

  const pool = [...tier];
  const picked = [];
  while (picked.length < max && pool.length > 0) {
    let candidates = pool;
    if (picked.length === 0 && lastShownId && pool.length > 1) {
      candidates = pool.filter((ad) => ad.id !== lastShownId);
    }
    const weights = candidates.map((ad) => (slot.rotation === "priority" ? Math.max(ad.priority, 1) : 1));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = random() * total;
    let chosen = candidates[candidates.length - 1];
    for (let i = 0; i < candidates.length; i += 1) {
      roll -= weights[i];
      if (roll < 0) {
        chosen = candidates[i];
        break;
      }
    }
    picked.push(chosen);
    pool.splice(pool.indexOf(chosen), 1);
  }
  return picked;
}

// Splits article HTML after its Nth top-level paragraph so an ad can sit
// between the halves. "Top level" matters: cutting inside a list, table or
// quote would leave unbalanced tags. Returns null when the article is too
// short (fewer than N + 2 top-level paragraphs) to be worth splitting.
export function splitHtmlAfterParagraph(html, paragraphNumber = 3) {
  if (typeof html !== "string") return null;
  const tokens = /<(\/?)(ul|ol|table|blockquote)\b[^>]*>|<\/p>/gi;
  let depth = 0;
  let count = 0;
  let splitIndex = -1;
  let totalTopLevel = 0;
  let match;
  while ((match = tokens.exec(html)) !== null) {
    if (match[2]) {
      depth += match[1] ? -1 : 1;
      if (depth < 0) depth = 0;
    } else if (depth === 0) {
      count += 1;
      totalTopLevel += 1;
      if (count === paragraphNumber) splitIndex = match.index + match[0].length;
    }
  }
  if (splitIndex === -1 || totalTopLevel < paragraphNumber + 2) return null;
  return [html.slice(0, splitIndex), html.slice(splitIndex)];
}
