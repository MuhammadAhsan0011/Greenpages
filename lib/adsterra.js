// Master switch for every Adsterra unit on the site: the Social Bar script in
// app/layout.js, the banner under the navigation, the footer band, and the
// 160x600 sidebar banners. false = none of them render and none of Adsterra's
// scripts load. All the code is still there - set this back to true (and
// redeploy) to bring them back exactly as they were.
//
// Deliberately NOT covered: the own-banner Advertisement Manager (AdSlot),
// Google AdSense, and the small Adsterra referral badge on /jobs.
export const ADSTERRA_ENABLED = false;
