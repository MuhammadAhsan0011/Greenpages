// Single source of truth for the production host. If a custom domain ever
// changes, update this once — canonical tags, sitemap.xml, robots.txt,
// structured-data URLs, and middleware.js's *.vercel.app redirect all read
// from here instead of each carrying their own literal.
export const SITE_URL = "https://www.greenpagespk.com";
export const SITE_HOST = new URL(SITE_URL).host;
