// TODO: Replace "https://example.com" with your real production domain.
const siteUrl = "https://example.com";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
