// If you later attach a custom domain, update this to match.
const siteUrl = "https://www.greenpagespk.com";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
