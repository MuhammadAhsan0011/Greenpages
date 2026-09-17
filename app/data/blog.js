// Central data source for all blog posts. Both /blog (listing) and
// /blog/[slug] (detail pages, generateStaticParams, generateMetadata)
// read from this single array so content stays consistent in one place.
import { createTaxonomyHelpers } from "@/lib/taxonomy";

export const posts = [
  {
  slug: "server-rendering-vs-client-rendering",
  title: "Why Your Marketing Site Should Be Server-Rendered",
  category: "Web Development",
  date: "2026-08-20",
  author: "Green Pages Team",
  readTime: "8 min read",
  excerpt:
    "A client-rendered marketing site asks Google to run your JavaScript before it can read a word of your copy. Here is what each rendering strategy actually costs you.",
  metaDescription:
    "SSG vs SSR vs CSR vs ISR compared for marketing sites: what crawlers see, TTFB, Core Web Vitals impact and how to pick the right rendering strategy.",
  sections: [
    {
      heading: "The problem with client-side rendering",
      body: "A client-rendered site sends an almost empty HTML document and a large JavaScript bundle. The browser downloads that bundle, executes it, fetches your content over the network, and only then paints anything readable. For a visitor on a fast laptop this costs a second. For a crawler it costs a place in a rendering queue that can run days behind the initial crawl, and for a visitor on a mid-range phone over mobile data it costs a bounce. Nothing about your copy, your headings or your internal links exists in that first response — which means for a short window, the most important page on your site is a blank div.",
    },
    {
      heading: "The four strategies, side by side",
      body: "Every rendering approach is a trade between when the HTML gets built and how fresh it is. This is what each one gives you in practice on a marketing site.",
      table: {
        caption: "Rendering strategies compared for a marketing site",
        headers: ["Strategy", "HTML built", "What a crawler receives", "TTFB", "Best for"],
        rows: [
          ["CSR (client-side)", "In the browser, per visit", "Empty shell + JS bundle", "Fast, but blank", "Logged-in dashboards"],
          ["SSR (server-side)", "On the server, per request", "Full HTML", "Moderate", "Personalized or real-time pages"],
          ["SSG (static)", "Once, at build time", "Full HTML", "Fastest", "Marketing and service pages"],
          ["ISR (incremental)", "At build, revalidated on a timer", "Full HTML", "Fastest", "Blogs and large catalogues"],
        ],
      },
    },
    {
      heading: "For marketing pages, static wins almost every time",
      body: "Your homepage, service pages and about page change a few times a quarter. There is no reason to rebuild that HTML on every single request, and even less reason to rebuild it in each visitor's browser. Pre-render them at build time and every request becomes a static file read from a CDN edge node. The content is complete in the first response, Time to First Byte drops to whatever the network costs, and the server does no work at all. If a page needs to change more often than your deploy cadence, use ISR with a revalidation window rather than reaching for full server rendering.",
    },
    {
      heading: "What this does to Core Web Vitals",
      body: "Rendering strategy shows up directly in the three metrics Google reports. Largest Contentful Paint improves because the hero markup is in the first response instead of waiting behind a bundle. Cumulative Layout Shift improves because server-rendered markup can reserve space for images and fonts before paint. Interaction to Next Paint improves because you are hydrating two or three interactive components instead of an entire application. These are the thresholds to hold yourself to.",
      table: {
        caption: "Core Web Vitals thresholds (75th percentile of real users)",
        headers: ["Metric", "What it measures", "Good", "Needs work", "Poor"],
        rows: [
          ["LCP", "Time until the main content paints", "≤ 2.5s", "2.5s – 4.0s", "> 4.0s"],
          ["INP", "Responsiveness to interactions", "≤ 200ms", "200ms – 500ms", "> 500ms"],
          ["CLS", "Unexpected layout movement", "≤ 0.1", "0.1 – 0.25", "> 0.25"],
        ],
      },
    },
    {
      heading: "Ship JavaScript only where the page needs it",
      body: "Server rendering stops paying off the moment you hydrate the whole page anyway. The discipline that matters is drawing the client boundary as tightly as possible: a contact form needs state and event handlers, a mobile menu needs a toggle, and a pricing calculator needs both. Headings, body copy, cards, breadcrumbs and footers need none of it. On the sites we build, the interactive surface is usually two or three components, which keeps the hydration cost close to zero while the rest of the page stays pure HTML.",
    },
    {
      heading: "How to check what you are actually shipping",
      body: "Open your page, disable JavaScript, and reload. Whatever remains is what a crawler is guaranteed to see without waiting in a render queue. Then view source — not the inspector, which shows the DOM after scripts run — and search for your H1 and your body copy. If they are missing from the raw HTML, your content is dependent on JavaScript execution. Finally, run the page through Lighthouse on mobile throttling and look at the JavaScript execution time rather than the score, because that number is what your visitors on real phones are paying.",
    },
    {
      heading: "The migration is smaller than it looks",
      body: "Most teams assume this means a rewrite. Usually it means moving the pages that matter for search onto a server-rendered framework first, leaving the application behind whatever login wall it already lives behind. Marketing pages have few dependencies and no session state, so they port quickly. The care goes into the URL inventory and redirect map, not the components.",
    },
  ],
  relatedServiceSlug: "web-development",
},
  {
  slug: "internal-linking-guide",
  title: "Internal Linking: The Cheapest SEO Win Most Sites Ignore",
  category: "SEO",
  date: "2026-08-20",
  author: "Green Pages Team",
  readTime: "7 min read",
  excerpt:
    "Most sites publish good pages and then leave them stranded three clicks deep with no links pointing in. Here is how we audit and rebuild an internal link graph.",
  metaDescription:
    "A practical guide to internal linking for SEO: crawl depth, anchor text, hub-and-spoke structure and how to find orphan pages on your own site.",
  sections: [
    {
      heading: "Why internal links move rankings",
      body: "Every page on your site inherits authority from the pages that link to it. External backlinks bring that authority in, but internal links decide where it goes once it arrives. A page with strong external links and no outbound internal links is a reservoir with no pipes — the value sits there instead of lifting the commercial pages you actually want ranking. Internal links are also the primary way crawlers discover URLs. If nothing links to a page, search engines have to rely on your sitemap alone, which signals that even you do not consider the page important.",
    },
    {
      heading: "Crawl depth is the number to watch first",
      body: "Crawl depth is how many clicks a page sits from your homepage. As a rule of thumb, anything past three clicks gets crawled less often and ranks worse, and anything past five is effectively invisible. Run a crawl and sort by depth. On most sites we audit, the worst offenders are older blog posts and secondary service pages that were linked from a homepage module two redesigns ago and never relinked since. Pulling those pages back to depth two or three, usually through a hub page or a category index, is often the single fastest fix available.",
    },
    {
      heading: "Find your orphan pages",
      body: "An orphan page has zero internal links pointing at it. To find yours, export every URL from your sitemap, then export every URL your crawler actually reached by following links. The difference between those two lists is your orphan set. Expect surprises: landing pages built for a campaign, blog posts published straight from a CMS with no category assigned, and paginated archives are the usual suspects. Every orphan page is either worth linking to or worth removing — leaving it in limbo helps nobody.",
    },
    {
      heading: "Write anchor text that describes the destination",
      body: "Anchor text is one of the clearest signals you control about what a page is about. Use language a reader would actually search for. \"Read our guide to technical SEO audits\" tells both a person and a crawler what sits behind the link; \"click here\" and \"learn more\" tell them nothing. Vary the phrasing across pages rather than repeating one exact-match keyword everywhere, and never link a keyword to a page that does not genuinely answer it. Over-optimized anchors on a thin page are worse than no link at all.",
    },
    {
      heading: "Build hub and spoke, not a random web",
      body: "The structure that works reliably is a hub page covering a broad topic, with spoke pages covering the specific questions inside it. The hub links down to every spoke; each spoke links back up to the hub and sideways to two or three siblings. This shape gives crawlers an obvious path to every page, keeps depth shallow, and matches how readers actually move through a topic. It also makes new content easy to place: when you publish, you already know which hub it belongs to and which existing pages should link to it.",
    },
    {
      heading: "Make linking part of publishing, not a cleanup project",
      body: "Internal linking decays because it is treated as an audit task instead of a step in the workflow. Add two lines to your content brief: which existing pages must link to this new piece, and which pages this piece must link out to. Add the inbound links on the day you publish, not in a quarterly sweep. It takes ten minutes per article and removes almost every orphan page problem before it starts.",
    },
    {
      heading: "How to measure whether it worked",
      body: "Give it four to eight weeks and watch three things: average crawl depth across the site, the number of pages receiving at least one impression in Search Console, and impressions on the specific pages you added links to. Internal linking rarely produces a dramatic single-page jump. What it produces is a broader base of pages earning clicks, which is usually where the compounding traffic comes from.",
    },
  ],
  relatedServiceSlug: "seo",
},
  {
    slug: "seo-trends-2026",
    title: "10 SEO Trends Shaping Search in 2026",
    category: "SEO",
    date: "2026-01-15",
    author: "Green Pages Team",
    readTime: "7 min read",
    excerpt:
      "From AI-powered search results to evolving E-E-A-T signals, here's what's actually moving rankings in 2026 — and how to adapt your strategy.",
    metaDescription:
      "Discover the SEO trends shaping search in 2026, including AI Overviews, E-E-A-T, Core Web Vitals, and structured data — and how to adapt your strategy.",
    sections: [
      {
        heading: "AI Overviews Are Reshaping the Click-Through Landscape",
        body: "AI-generated summaries now appear above traditional results for a growing share of queries. Ranking well still matters, but so does being the source those summaries cite — which means clear, well-structured, directly answerable content matters more than ever.",
      },
      {
        heading: "E-E-A-T Signals Carry More Weight Than Ever",
        body: "Experience, Expertise, Authoritativeness, and Trust continue to separate pages that rank from pages that don't, especially in competitive niches. Author bios, original data, and transparent sourcing are no longer optional extras.",
      },
      {
        heading: "Core Web Vitals Remain a Baseline Requirement",
        body: "Site speed and stability aren't a ranking hack anymore — they're table stakes. Sites that fail Core Web Vitals thresholds are increasingly filtered out before content quality is even considered.",
      },
      {
        heading: "Structured Data Is No Longer Optional",
        body: "As search results become more visual and AI-assisted, structured data (JSON-LD) is how you tell search engines exactly what your content is. Pages without it are simply harder to understand and feature.",
      },
      {
        heading: "Content Depth Beats Content Volume",
        body: "Publishing thin content at scale is losing effectiveness. A smaller number of comprehensive, well-researched pages that fully answer a topic consistently outperform large volumes of shallow posts.",
      },
    ],
    relatedServiceSlug: "seo",
  },
  {
    slug: "technical-seo-audit-guide",
    title: "A Practical Guide to Running a Technical SEO Audit",
    category: "SEO",
    date: "2025-11-03",
    author: "Green Pages Team",
    readTime: "8 min read",
    excerpt:
      "Technical issues can quietly cap your rankings no matter how good your content is. Here's the audit checklist we run for every new client.",
    metaDescription:
      "A practical technical SEO audit checklist covering crawlability, indexation, site speed, mobile usability, and structured data.",
    sections: [
      {
        heading: "Start with Crawlability and Indexation",
        body: "Before anything else, confirm search engines can actually reach your pages. Check your robots.txt, XML sitemap, and canonical tags for conflicts that accidentally block or duplicate important pages.",
      },
      {
        heading: "Audit Site Speed and Core Web Vitals",
        body: "Slow-loading pages hurt both rankings and conversions. Measure Largest Contentful Paint, Interaction to Next Paint, and Cumulative Layout Shift, then prioritize fixes that affect your highest-traffic pages first.",
      },
      {
        heading: "Check Mobile Usability",
        body: "With mobile-first indexing, the mobile version of your site is what search engines actually evaluate. Test tap targets, font sizes, and layout stability on real devices, not just browser emulators.",
      },
      {
        heading: "Validate Structured Data",
        body: "Use structured data testing tools to confirm your JSON-LD markup is valid and matches the visible content on the page. Invalid markup can be ignored entirely or, worse, trigger manual review.",
      },
      {
        heading: "Review Internal Linking",
        body: "Internal links distribute authority across your site and help search engines understand which pages matter most. Make sure your most important pages aren't buried more than a few clicks from your homepage.",
      },
    ],
    relatedServiceSlug: "seo",
  },
  {
    slug: "content-marketing-strategy-that-converts",
    title: "How to Build a Content Marketing Strategy That Actually Converts",
    category: "Content Marketing",
    date: "2025-09-22",
    author: "Green Pages Team",
    readTime: "6 min read",
    excerpt:
      "Publishing more content isn't a strategy. Here's how to plan content that attracts the right audience and moves them toward a decision.",
    metaDescription:
      "Learn how to build a content marketing strategy that attracts qualified traffic and converts readers into leads, from funnel mapping to distribution.",
    sections: [
      {
        heading: "Map Content to Every Stage of the Funnel",
        body: "Awareness-stage readers need different content than someone comparing vendors. Build content for each stage — educational articles at the top, comparison and case-study content further down — so you're never leaving a gap in the journey.",
      },
      {
        heading: "Match Content to Real Search Intent",
        body: "Keyword volume means nothing if the intent doesn't match your offer. Before writing anything, ask what the searcher actually wants to accomplish, and make sure your content delivers that first.",
      },
      {
        heading: "Diversify Beyond the Blog Post",
        body: "Long-form articles are the foundation, but comparison pages, original research, video walkthroughs, and templates all extend reach and appeal to readers who don't want to read 2,000 words to get an answer.",
      },
      {
        heading: "Distribution Is Half the Job",
        body: "Great content that nobody sees doesn't move the needle. Pair every piece with a distribution plan — email, social, outreach — so it earns traffic and links instead of sitting quietly on your blog.",
      },
    ],
    relatedServiceSlug: "content-marketing",
  },
  {
    slug: "website-speed-and-conversions",
    title: "Website Speed and Conversions: What the Data Actually Shows",
    category: "Web Development",
    date: "2025-08-10",
    author: "Green Pages Team",
    readTime: "5 min read",
    excerpt:
      "Every additional second of load time costs you conversions. We break down why performance is a growth lever, not just a technical checkbox.",
    metaDescription:
      "Why website performance directly impacts conversions and SEO rankings, and the practical steps that move Core Web Vitals in the right direction.",
    sections: [
      {
        heading: "Speed Is a Conversion Metric, Not Just a Technical One",
        body: "Studies across industries consistently show conversion rates drop as load time increases. Performance work isn't just an engineering concern — it's directly tied to revenue.",
      },
      {
        heading: "Perceived Performance Matters as Much as Raw Speed",
        body: "How fast a page feels often matters more than raw load time. Rendering visible content quickly, avoiding layout shift, and keeping interactions responsive all shape how users perceive your site's speed.",
      },
      {
        heading: "Images and JavaScript Are the Usual Culprits",
        body: "Unoptimized images and excessive client-side JavaScript are the most common causes of slow pages. Serving right-sized images and shipping only the JavaScript a page actually needs makes an outsized difference.",
      },
      {
        heading: "Build Performance In, Don't Bolt It On",
        body: "Retrofitting a slow site is far harder than building on a performance-first foundation. Frameworks that render on the server and ship minimal JavaScript by default make fast sites the path of least resistance.",
      },
    ],
    relatedServiceSlug: "web-development",
  },
];

// Two-level blog taxonomy (20 parents / 183 children). description,
// metaTitle and metaDescription are intentionally empty strings for now —
// see the same note on app/data/businessCategories.js. Child slugs are
// generated by lowercasing, turning "&" into "and", and spaces into
// hyphens (e.g. "Loans & Credit" -> "loans-and-credit"), same rule used
// throughout docs/seo/category-migration-diff.md.
export const BLOG_CATEGORIES = [
  {
    name: "Business", slug: "business", sortOrder: 1, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Entrepreneurship", slug: "entrepreneurship", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Small Business", slug: "small-business", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Startups", slug: "startups", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Business Ideas", slug: "business-ideas", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Management & Leadership", slug: "management-and-leadership", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Sales", slug: "sales", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "E-commerce", slug: "e-commerce", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Franchising", slug: "franchising", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Business Plans", slug: "business-plans", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
      { name: "Business News", slug: "business-news", sortOrder: 10, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Finance", slug: "finance", sortOrder: 2, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Personal Finance", slug: "personal-finance", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Investing", slug: "investing", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Banking", slug: "banking", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Taxation", slug: "taxation", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Insurance", slug: "insurance", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Loans & Credit", slug: "loans-and-credit", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Cryptocurrency", slug: "cryptocurrency", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Budgeting & Saving", slug: "budgeting-and-saving", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Retirement Planning", slug: "retirement-planning", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
      { name: "Financial Literacy", slug: "financial-literacy", sortOrder: 10, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Technology", slug: "technology", sortOrder: 3, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Software & Apps", slug: "software-and-apps", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Gadgets & Devices", slug: "gadgets-and-devices", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Artificial Intelligence", slug: "artificial-intelligence", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Cybersecurity", slug: "cybersecurity", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Mobile Technology", slug: "mobile-technology", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Gaming", slug: "gaming", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Internet & Networking", slug: "internet-and-networking", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Cloud Computing", slug: "cloud-computing", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Tech News", slug: "tech-news", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Digital Marketing", slug: "digital-marketing", sortOrder: 4, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "SEO", slug: "seo", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Local SEO", slug: "local-seo", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Social Media Marketing", slug: "social-media-marketing", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Content Marketing", slug: "content-marketing", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Email Marketing", slug: "email-marketing", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Paid Advertising", slug: "paid-advertising", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Affiliate Marketing", slug: "affiliate-marketing", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Marketing Analytics", slug: "marketing-analytics", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Branding", slug: "branding", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
      { name: "Web Development", slug: "web-development", sortOrder: 10, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Education", slug: "education", sortOrder: 5, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Schools & Colleges", slug: "schools-and-colleges", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Universities", slug: "universities", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Online Learning", slug: "online-learning", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Study Abroad", slug: "study-abroad", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Scholarships", slug: "scholarships", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Exams & Test Prep", slug: "exams-and-test-prep", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Study Tips", slug: "study-tips", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Language Learning", slug: "language-learning", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "EdTech", slug: "edtech", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
      { name: "Admissions", slug: "admissions", sortOrder: 10, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Career", slug: "career", sortOrder: 6, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Job Search", slug: "job-search", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Resume & Cover Letters", slug: "resume-and-cover-letters", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Interview Tips", slug: "interview-tips", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Freelancing", slug: "freelancing", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Remote Work", slug: "remote-work", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Workplace Skills", slug: "workplace-skills", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Career Change", slug: "career-change", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Professional Development", slug: "professional-development", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Internships", slug: "internships", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
      { name: "Salary & Negotiation", slug: "salary-and-negotiation", sortOrder: 10, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Real Estate", slug: "real-estate", sortOrder: 7, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Buying Property", slug: "buying-property", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Selling Property", slug: "selling-property", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Renting", slug: "renting", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Property Investment", slug: "property-investment", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Home Loans", slug: "home-loans", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Housing Societies", slug: "housing-societies", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Commercial Property", slug: "commercial-property", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Property Laws", slug: "property-laws", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Construction", slug: "construction", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
      { name: "Real Estate News", slug: "real-estate-news", sortOrder: 10, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Health & Fitness", slug: "health-fitness", sortOrder: 8, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Nutrition & Diet", slug: "nutrition-and-diet", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Exercise & Workouts", slug: "exercise-and-workouts", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Mental Health", slug: "mental-health", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Weight Loss", slug: "weight-loss", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Medical Conditions", slug: "medical-conditions", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Alternative Medicine", slug: "alternative-medicine", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Sleep", slug: "sleep", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Women's Health", slug: "womens-health", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Men's Health", slug: "mens-health", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
      { name: "First Aid", slug: "first-aid", sortOrder: 10, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Self Improvement", slug: "self-improvement", sortOrder: 9, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Productivity", slug: "productivity", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Motivation", slug: "motivation", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Habits", slug: "habits", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Time Management", slug: "time-management", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Goal Setting", slug: "goal-setting", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Confidence & Self-Esteem", slug: "confidence-and-self-esteem", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Mindfulness & Meditation", slug: "mindfulness-and-meditation", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Public Speaking", slug: "public-speaking", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Learning Skills", slug: "learning-skills", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
      { name: "Decision Making", slug: "decision-making", sortOrder: 10, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Relationships", slug: "relationships", sortOrder: 10, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Marriage", slug: "marriage", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Dating", slug: "dating", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Friendship", slug: "friendship", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Parenting", slug: "parenting", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Family Relationships", slug: "family-relationships", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Communication", slug: "communication", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Conflict Resolution", slug: "conflict-resolution", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Separation & Divorce", slug: "separation-and-divorce", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Home & Family", slug: "home-family", sortOrder: 11, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Home Improvement", slug: "home-improvement", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Interior Design", slug: "interior-design", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Gardening", slug: "gardening", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Cleaning & Organization", slug: "cleaning-and-organization", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Home Security", slug: "home-security", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "DIY Projects", slug: "diy-projects", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Kitchen & Appliances", slug: "kitchen-and-appliances", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Moving & Relocation", slug: "moving-and-relocation", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Home Maintenance", slug: "home-maintenance", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Travel", slug: "travel", sortOrder: 12, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Destinations", slug: "destinations", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Travel Tips", slug: "travel-tips", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Budget Travel", slug: "budget-travel", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Hotels & Accommodation", slug: "hotels-and-accommodation", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Visa & Documentation", slug: "visa-and-documentation", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Hajj & Umrah", slug: "hajj-and-umrah", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Adventure Travel", slug: "adventure-travel", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Food Travel", slug: "food-travel", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Travel Gear", slug: "travel-gear", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
      { name: "Northern Areas", slug: "northern-areas", sortOrder: 10, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Food & Cooking", slug: "food-cooking", sortOrder: 13, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Recipes", slug: "recipes", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Pakistani Cuisine", slug: "pakistani-cuisine", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Restaurant Reviews", slug: "restaurant-reviews", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Baking", slug: "baking", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Healthy Eating", slug: "healthy-eating", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Kitchen Tips", slug: "kitchen-tips", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Beverages", slug: "beverages", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Street Food", slug: "street-food", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Desserts", slug: "desserts", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Sports", slug: "sports", sortOrder: 14, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Cricket", slug: "cricket", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Football", slug: "football", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Hockey", slug: "hockey", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Tennis", slug: "tennis", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Athletics", slug: "athletics", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Esports", slug: "esports", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Combat Sports", slug: "combat-sports", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Sports News", slug: "sports-news", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Fitness Sports", slug: "fitness-sports", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Writing", slug: "writing", sortOrder: 15, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Content Writing", slug: "content-writing", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Copywriting", slug: "copywriting", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Blogging", slug: "blogging", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Creative Writing", slug: "creative-writing", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Technical Writing", slug: "technical-writing", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Grammar & Style", slug: "grammar-and-style", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Publishing", slug: "publishing", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Writing Tools", slug: "writing-tools", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Storytelling", slug: "storytelling", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Lifestyle & Fashion", slug: "lifestyle-fashion", sortOrder: 16, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Fashion Trends", slug: "fashion-trends", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Beauty & Skincare", slug: "beauty-and-skincare", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Men's Grooming", slug: "mens-grooming", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Shopping Guides", slug: "shopping-guides", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Weddings", slug: "weddings", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Events & Celebrations", slug: "events-and-celebrations", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Hobbies", slug: "hobbies", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Minimalism", slug: "minimalism", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Pets & Animals", slug: "pets-animals", sortOrder: 17, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Dogs", slug: "dogs", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Cats", slug: "cats", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Birds", slug: "birds", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Fish & Aquariums", slug: "fish-and-aquariums", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Pet Health", slug: "pet-health", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Pet Training", slug: "pet-training", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Pet Products", slug: "pet-products", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Livestock & Farm Animals", slug: "livestock-and-farm-animals", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "News & Society", slug: "news-society", sortOrder: 18, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Current Affairs", slug: "current-affairs", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Politics", slug: "politics", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Law & Legal", slug: "law-and-legal", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Environment", slug: "environment", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Culture & Heritage", slug: "culture-and-heritage", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Religion", slug: "religion", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Social Issues", slug: "social-issues", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Community", slug: "community", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
      { name: "Human Interest", slug: "human-interest", sortOrder: 9, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Automotive", slug: "automotive-blog", sortOrder: 19, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Car Reviews", slug: "car-reviews", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Car Maintenance", slug: "car-maintenance", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Buying & Selling Cars", slug: "buying-and-selling-cars", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Bikes & Motorcycles", slug: "bikes-and-motorcycles", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Electric Vehicles", slug: "electric-vehicles", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Driving Tips", slug: "driving-tips", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Auto News", slug: "auto-news", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
      { name: "Car Modifications", slug: "car-modifications", sortOrder: 8, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
  {
    name: "Entertainment", slug: "entertainment", sortOrder: 20, description: "", metaTitle: "", metaDescription: "",
    children: [
      { name: "Movies & TV", slug: "movies-and-tv", sortOrder: 1, description: "", metaTitle: "", metaDescription: "" },
      { name: "Music", slug: "music", sortOrder: 2, description: "", metaTitle: "", metaDescription: "" },
      { name: "Books", slug: "books", sortOrder: 3, description: "", metaTitle: "", metaDescription: "" },
      { name: "Celebrities", slug: "celebrities", sortOrder: 4, description: "", metaTitle: "", metaDescription: "" },
      { name: "Arts & Culture", slug: "arts-and-culture", sortOrder: 5, description: "", metaTitle: "", metaDescription: "" },
      { name: "Photography", slug: "photography", sortOrder: 6, description: "", metaTitle: "", metaDescription: "" },
      { name: "Events", slug: "events", sortOrder: 7, description: "", metaTitle: "", metaDescription: "" },
    ],
  },
];

export function getPostBySlug(slug) {
  return posts.find((post) => post.slug === slug);
}

// Turns a category name ("Content Marketing") into a URL-safe slug
// ("content-marketing"). Still used as a plain string utility wherever a
// post's raw category name needs to become a lookup slug (BlogCard.js,
// blog/[slug]/page.js) — the taxonomy tree/helpers below are the source of
// truth for which slugs actually exist and how they nest.
export function categorySlug(category) {
  return category
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const {
  getAllParents,
  getAllChildren,
  getParent,
  getChild,
  findBySlug,
  isValidCategorySlug,
  resolveCategoryNodes,
} = createTaxonomyHelpers(BLOG_CATEGORIES);

// Resolves a raw post/article category name to the right
// /blog/category/... path — see the identical rationale on
// businessCategories.js's getCategoryLinkPath.
export function getCategoryLinkPath(categoryName) {
  for (const parent of BLOG_CATEGORIES) {
    if (parent.name === categoryName) {
      return `/blog/category/${parent.slug}`;
    }
    for (const child of parent.children) {
      if (child.name === categoryName) {
        return `/blog/category/${parent.slug}/${child.slug}`;
      }
    }
  }
  return "/blog";
}

// Rough reading-time estimate for user-submitted article content (static
// posts already carry a hand-set readTime). Strips HTML tags first so it
// works the same for both markdown-lite (Free) and sanitized-HTML
// (Verified/Featured) article content.
export function estimateReadTime(content) {
  const words = content
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

// Normalizes a raw Supabase "articles" row into the same shape as a static
// post from the `posts` array above, so BlogCard and the listing pages can
// render both without caring which source a post came from.
export function normalizeDbArticle(article) {
  return {
    slug: article.slug,
    title: article.title,
    category: article.category,
    date: article.published_at ?? article.created_at,
    excerpt: article.excerpt,
    readTime: estimateReadTime(article.content),
    coverImageUrl: article.cover_image_url ?? null,
    tags: article.tags ?? null,
    isUserSubmitted: true,
  };
}
