// If you later attach a custom domain, update this to match.
const siteUrl = "https://greenpages-pk.vercel.app";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
