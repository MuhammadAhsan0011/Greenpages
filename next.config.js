/** @type {import('next').NextConfig} */
const nextConfig = {
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
