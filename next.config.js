/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
