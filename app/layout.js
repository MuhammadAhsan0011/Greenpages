import Script from "next/script";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ReturnVisitorReviewPopup from "./components/ReturnVisitorReviewPopup";
import AdsterraBanner from "./components/AdsterraBanner";
import { SITE_URL } from "@/lib/site";

const GA_MEASUREMENT_ID = "G-E22PSF8FHE";

const siteUrl = SITE_URL;
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
    google: [
      "6VCBUlR_v8_pEeVxFlFwLly51ldq7-LHKxwOve1bSZQ",
      "eLyflD3ZyFvDB0jjD2YYNOGdOpSqQizd-XkmcSqBJvQ",
    ],
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
  email: "greenpages.pk.com@gmail.com",
  telephone: "+92 303 2672509",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Karachi",
    addressCountry: "PK",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "greenpages.pk.com@gmail.com",
    telephone: "+92 303 2672509",
  },
  sameAs: [
    "https://www.facebook.com/greenpages.pk",
    "https://www.instagram.com/greenpages.pk",
    "https://www.linkedin.com/company/green-pages-pk/",
  ],
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. QuillBot, Grammarly)
    // inject attributes onto <html> before React hydrates, causing a false
    // mismatch warning that has nothing to do with app code.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3259059838058421"
          crossOrigin="anonymous"
        />
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html:
              "(function(s){s.dataset.zone='11932500',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))",
          }}
        />
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html:
              "(function(s){s.dataset.zone='11932497',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))",
          }}
        />
        <script
          src="https://5gvci.com/act/files/tag.min.js?z=11932525"
          data-cfasync="false"
          async
        />
        {/* Adsterra Social Bar — sitewide overlay unit, no content placement
            needed (unlike the Native Banner/iframe banner units below it in
            the Adsterra dashboard, which render into a specific container
            element wherever that's placed in the page). */}
        <script
          data-cfasync="false"
          src="https://bicea.org/14/995236a502054aa1860745841e5c2365"
        />
      </head>
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
        <div className="ad-top-banner">
          <AdsterraBanner
            adKey="0a101d92828b53ade8b6cf3deab8495c"
            width={728}
            height={90}
            className="ad-banner-desktop"
          />
          <AdsterraBanner
            adKey="084bca52f51a263bcc66a574fc4cb7ac"
            width={320}
            height={50}
            className="ad-banner-mobile"
          />
        </div>
        <main>{children}</main>
        <Footer />
        <ReturnVisitorReviewPopup />
      </body>
    </html>
  );
}
