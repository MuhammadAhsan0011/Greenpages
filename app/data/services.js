// Central data source for all services. Both /services (listing) and
// /services/[slug] (detail pages, generateStaticParams, generateMetadata)
// read from this single array so content stays consistent in one place.

export const services = [
  {
    slug: "seo",
    title: "Search Engine Optimization",
    shortTitle: "SEO",
    icon: "🔍",
    shortDescription:
      "Rank higher on Google and drive consistent, high-intent organic traffic with technical, on-page, and content-driven SEO.",
    metaDescription:
      "Green Pages' SEO services combine technical audits, keyword strategy, on-page optimization, and link building to grow your organic search traffic and rankings.",
    heroDescription:
      "We help businesses climb search rankings and earn organic traffic that converts, using a data-backed SEO process refined across dozens of industries.",
    sections: [
      {
        heading: "Comprehensive Technical SEO Audits",
        body: "We start every engagement with a full technical audit — crawlability, indexation, site speed, Core Web Vitals, structured data, and mobile usability — so your site has a solid foundation before we scale content and links.",
      },
      {
        heading: "Keyword Research & Search Intent Strategy",
        body: "We identify the exact terms your customers are searching for, map them to search intent, and build a content roadmap that targets high-value, achievable keywords rather than vanity metrics.",
      },
      {
        heading: "On-Page Optimization",
        body: "From title tags and header hierarchy to internal linking and content structure, we optimize every page element that influences how search engines understand and rank your content.",
      },
      {
        heading: "Authority & Link Building",
        body: "We earn high-quality backlinks through digital PR, content partnerships, and outreach — building the domain authority needed to compete for competitive keywords.",
      },
    ],
    benefits: [
      "Higher rankings for high-intent, revenue-driving keywords",
      "Sustainable organic traffic growth that compounds over time",
      "Improved technical health and Core Web Vitals scores",
      "Clear monthly reporting tied to traffic and conversions",
    ],
    relatedSlugs: ["content-marketing", "web-development"],
  },
  {
    slug: "web-development",
    title: "Web Development",
    shortTitle: "Web Development",
    icon: "💻",
    shortDescription:
      "Fast, responsive, conversion-focused websites built with modern frameworks and SEO best practices from day one.",
    metaDescription:
      "Green Pages builds fast, responsive, SEO-ready websites using modern frameworks like Next.js — engineered for Core Web Vitals, conversions, and long-term scalability.",
    heroDescription:
      "We design and build websites that load fast, rank well, and turn visitors into customers — built on modern, maintainable technology.",
    sections: [
      {
        heading: "Modern, Performance-First Builds",
        body: "We build on frameworks like Next.js to deliver server-rendered pages, optimized images, and minimal JavaScript — giving you excellent Core Web Vitals scores out of the box.",
      },
      {
        heading: "Responsive, Accessible Design",
        body: "Every site we ship works seamlessly across desktop, tablet, and mobile, and follows accessibility best practices so it's usable by the widest possible audience.",
      },
      {
        heading: "SEO-Ready Architecture",
        body: "Clean URL structures, semantic HTML, proper metadata, and fast load times are built into the architecture from the first commit — not bolted on afterward.",
      },
      {
        heading: "Scalable Foundations",
        body: "Whether you need a marketing site, a content-driven platform, or an e-commerce storefront, we architect a codebase that's easy to extend as your business grows.",
      },
    ],
    benefits: [
      "Fast load times that improve rankings and reduce bounce rate",
      "Fully responsive design across every device",
      "SEO-friendly architecture baked into the codebase",
      "A scalable foundation that grows with your business",
    ],
    relatedSlugs: ["seo", "content-marketing"],
  },
  {
    slug: "content-marketing",
    title: "Content Marketing",
    shortTitle: "Content Marketing",
    icon: "✍️",
    shortDescription:
      "Strategic content that attracts, engages, and converts your target audience across every stage of the funnel.",
    metaDescription:
      "Green Pages' content marketing services combine strategy, writing, and distribution to build organic traffic, brand authority, and qualified leads.",
    heroDescription:
      "We create content that does more than fill a blog — it attracts the right audience, builds trust, and moves people toward a decision.",
    sections: [
      {
        heading: "Content Strategy & Planning",
        body: "We build a content roadmap grounded in keyword research, competitor gaps, and your funnel — so every piece of content has a clear purpose and audience.",
      },
      {
        heading: "SEO-Driven Writing",
        body: "Our writers create in-depth, well-researched articles and landing pages optimized for both readers and search engines, aligned with your brand voice.",
      },
      {
        heading: "Visual & Video Content",
        body: "We complement written content with visuals, infographics, and video to increase engagement and time on page — signals that support your SEO performance.",
      },
      {
        heading: "Distribution & Promotion",
        body: "Great content needs an audience. We distribute your content through email, social, and outreach channels to maximize reach and link acquisition.",
      },
    ],
    benefits: [
      "Increased organic traffic from targeted, evergreen content",
      "Stronger brand authority and audience trust",
      "Higher engagement and lower bounce rates",
      "A steady pipeline of qualified leads over time",
    ],
    relatedSlugs: ["seo", "web-development"],
  },
];

export function getServiceBySlug(slug) {
  return services.find((service) => service.slug === slug);
}
