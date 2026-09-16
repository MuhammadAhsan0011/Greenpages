// Permanent (301) redirects from the old flat category taxonomy to the new
// two-level one. Source of truth for why each mapping was chosen is
// docs/seo/category-migration-diff.md — do not add/remove an entry here
// without updating that file too.
//
// NOTE: several destinations below are nested `[parent]/[child]` category
// pages that don't exist until the taxonomy files are rewritten (Task 1 of
// this migration). Until that lands, these redirects are correct in shape
// (verified by curling for a 301 + Location header) but will land on a 404.
// Do not deploy this branch until the nested category routes exist.
const categoryRedirects = [
  // --- Directory categories (/businesses/category/...) ---
  { source: "/businesses/category/healthcare-medical", destination: "/businesses/category/health-medical" },
  { source: "/businesses/category/financial-insurance-services", destination: "/businesses/category/financial-services" },
  { source: "/businesses/category/seo", destination: "/businesses/category/technology-digital/digital-marketing-agencies" },
  { source: "/businesses/category/it-software-services", destination: "/businesses/category/technology-digital" },
  { source: "/businesses/category/freight-shipping-logistics", destination: "/businesses/category/transport-logistics" },
  { source: "/businesses/category/hospitality-tourism", destination: "/businesses/category/travel-hospitality" },
  { source: "/businesses/category/beauty-salons", destination: "/businesses/category/beauty-wellness/beauty-salons" },
  { source: "/businesses/category/web-development", destination: "/businesses/category/technology-digital/web-development" },
  { source: "/businesses/category/solar-renewable-energy", destination: "/businesses/category/real-estate-construction/solar-installation" },
  { source: "/businesses/category/textiles-garments", destination: "/businesses/category/industrial-manufacturing/textile-manufacturers" },
  { source: "/businesses/category/food-beverage", destination: "/businesses/category/food-dining" },
  { source: "/businesses/category/cosmetics-personal-care", destination: "/businesses/category/beauty-wellness" },
  { source: "/businesses/category/legal-services", destination: "/businesses/category/professional-services/lawyers-legal" },
  { source: "/businesses/category/real-estate", destination: "/businesses/category/real-estate-construction" },
  { source: "/businesses/category/content-marketing", destination: "/businesses/category/technology-digital/digital-marketing-agencies" },
  { source: "/businesses/category/manufacturing", destination: "/businesses/category/industrial-manufacturing" },
  { source: "/businesses/category/construction-real-estate", destination: "/businesses/category/real-estate-construction" },
  { source: "/businesses/category/industrial-machinery", destination: "/businesses/category/industrial-manufacturing/machinery-tools" },
  { source: "/businesses/category/packaging-printing", destination: "/businesses/category/industrial-manufacturing/plastic-packaging" },
  { source: "/businesses/category/chemicals-rubber-plastics", destination: "/businesses/category/industrial-manufacturing/chemicals-industrial" },
  { source: "/businesses/category/electrical-electronics", destination: "/businesses/category/shopping-retail/electronics-appliances" },
  { source: "/businesses/category/furniture-interior-design", destination: "/businesses/category/shopping-retail/furniture-stores" },
  { source: "/businesses/category/events-entertainment", destination: "/businesses/category/events-weddings" },
  { source: "/businesses/category/sports-fitness", destination: "/businesses/category/beauty-wellness/gyms-fitness" },
  { source: "/businesses/category/retail-e-commerce", destination: "/businesses/category/shopping-retail" },
  { source: "/businesses/category/fashion-apparel", destination: "/businesses/category/shopping-retail/clothing-boutiques" },
  { source: "/businesses/category/security-surveillance", destination: "/businesses/category/technology-digital/cctv-security" },
  // "Other" is retired outright — no equivalent exists in the new taxonomy,
  // and the 5 businesses that were in it get reassigned individually
  // (pending review, see category-migration-diff.md), not auto-mapped.
  { source: "/businesses/category/other", destination: "/businesses" },

  // --- Blog categories (/blog/category/...) ---
  { source: "/blog/category/seo", destination: "/blog/category/digital-marketing/seo" },
  { source: "/blog/category/web-development", destination: "/blog/category/digital-marketing/web-development" },
  { source: "/blog/category/content-marketing", destination: "/blog/category/digital-marketing/content-marketing" },
  { source: "/blog/category/services", destination: "/blog" },
  { source: "/blog/category/accounting", destination: "/blog/category/finance" },
  // The one post in "online" turned out to be about an Akhuwat loan
  // application - neither of the two options it was scoped to (e-commerce
  // vs. internet-and-networking) fit, so it's reassigned to finance's
  // "Loans & Credit" child instead. See docs/seo/category-migration-diff.md.
  { source: "/blog/category/online", destination: "/blog/category/finance/loans-and-credit" },
].map((entry) => ({ ...entry, permanent: true }));

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return categoryRedirects;
  },
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Next.js defaults Server Action request bodies to 1MB, which is too
      // small for real photo uploads (business logos, article cover/inline
      // images). Raised to match the 5MB limit already set on the
      // Supabase "uploads" storage bucket (see supabase/schema.sql).
      bodySizeLimit: "8mb",
    },
  },
  images: {
    // This project's decorative illustrations are local SVG files, so SVG
    // support has to be explicitly enabled for next/image's optimizer.
    // The CSP below prevents any scripts embedded in an SVG from executing.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        // User-uploaded business logos and article cover images, served
        // from this project's Supabase Storage bucket. Update the
        // hostname if you ever migrate to a different Supabase project.
        protocol: "https",
        hostname: "kjukxykigizrdcwsxjyc.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = nextConfig;
