import Script from "next/script";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const GA_MEASUREMENT_ID = "G-E22PSF8FHE";

// If you later attach a custom domain, update this (and app/sitemap.js /
// app/robots.js) to match.
const siteUrl = "https://greenpages-pk.vercel.app";
const siteName = "Green Pages";
const siteDescription =
  "Green Pages is a full-service digital marketing agency helping businesses grow through SEO, web development, and content marketing.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Digital Marketing Agency`,
    template: "%s | Green Pages",
  },
  description: siteDescription,
  keywords: [
    "digital marketing agency",
    "SEO services",
    "web development agency",
    "content marketing",
    "Green Pages",
  ],
  authors: [{ name: "Green Pages" }],
  creator: "Green Pages",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: siteName,
    title: `${siteName} | Digital Marketing Agency`,
    description: siteDescription,
    images: [
      {
        url: "/images/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Green Pages - Digital Marketing Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Digital Marketing Agency`,
    description: siteDescription,
    images: ["/images/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: "6VCBUlR_v8_pEeVxFlFwLly51ldq7-LHKxwOve1bSZQ",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

// JSON-LD structured data describing Green Pages as an organization. Placed
// in the root layout so it's present (and consistent) on every page.
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Green Pages",
  url: siteUrl,
  logo: `${siteUrl}/images/og-image.svg`,
  description: siteDescription,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "kimmak209@gmail.com",
  },
  sameAs: [],
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. QuillBot, Grammarly)
    // inject attributes onto <html> before React hydrates, causing a false
    // mismatch warning that has nothing to do with app code.
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* Google Analytics — next/script defers/loads this efficiently
            instead of a render-blocking plain <script> tag. */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
