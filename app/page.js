import Image from "next/image";
import Button from "./components/Button";
import ServiceCard from "./components/ServiceCard";
import BlogCard from "./components/BlogCard";
import { services } from "./data/services";
import { normalizeDbArticle } from "./data/blog";
import { createPublicClient } from "@/utils/supabase/public";
import heroIllustration from "../public/images/hero-illustration.svg";

// Revalidates periodically so newly-featured articles show up here without
// a rebuild, while the page stays cached/static like the rest of the site.
export const revalidate = 60;

export const metadata = {
  title: "Pakistan Business Directory & Digital Marketing Agency",
  description:
    "Green Pages is Pakistan's business directory and digital marketing agency — list your business free, get discovered by customers, and grow with expert SEO, web development, and content marketing.",
  alternates: {
    canonical: "/",
  },
};

const howItWorks = [
  {
    step: "1",
    title: "Register",
    description: "Create a free account in under a minute — no credit card required.",
  },
  {
    step: "2",
    title: "Add Your Business",
    description:
      "Fill in your business details, category, and city to build your public profile.",
  },
  {
    step: "3",
    title: "Get Found",
    description:
      "Your listing goes live instantly in the directory, ready for customers to find you.",
  },
];

const whyChooseUs = [
  {
    icon: "01",
    title: "Data-Driven Strategy",
    description:
      "Every recommendation we make is backed by data, competitor research, and measurable KPIs — not guesswork.",
  },
  {
    icon: "02",
    title: "Transparent Reporting",
    description:
      "You get clear monthly reports tied to real business outcomes, so you always know what your investment is producing.",
  },
  {
    icon: "03",
    title: "Full-Funnel Expertise",
    description:
      "From technical SEO to conversion-focused web development, our team covers every channel that drives growth.",
  },
  {
    icon: "04",
    title: "Dedicated Partnership",
    description:
      "We work as an extension of your team, with a dedicated strategist who understands your goals and industry.",
  },
];

// This is a Server Component by default — it renders on the server with
// no client-side JavaScript required, which keeps the homepage fast and
// fully crawlable for search engines.
export default async function HomePage() {
  const supabase = createPublicClient();
  const { data: featuredArticles } = await supabase
    .from("articles")
    .select("slug, title, category, published_at, excerpt, content, cover_image_url, tags")
    .eq("featured_on_homepage", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(3);

  const featured = (featuredArticles ?? []).map(normalizeDbArticle);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="hero-eyebrow">Pakistan Business Directory</span>
            <h1>Grow Your Business with Green Pages</h1>
            <p className="hero-description">
              List your business free and get discovered by customers across
              Pakistan, then grow further with expert SEO, web development,
              and content marketing from our in-house team.
            </p>
            <div className="hero-ctas">
              <Button href="/signup" variant="primary">
                List Your Business Free
              </Button>
              <Button href="/businesses" variant="secondary">
                Browse the Directory
              </Button>
            </div>
          </div>
          <div className="hero-image">
            <Image
              src={heroIllustration}
              alt="Illustration of a growth chart trending upward alongside a search magnifying glass, representing SEO-driven business growth"
              priority
              sizes="(max-width: 900px) 100vw, 560px"
            />
          </div>
        </div>
      </section>

      <section className="section-alt" aria-labelledby="how-it-works-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">How It Works</span>
            <h2 id="how-it-works-heading">Listed in Three Simple Steps</h2>
          </div>
          <div className="grid grid-3">
            {howItWorks.map((item) => (
              <div className="how-it-works-step" key={item.step}>
                <span className="how-it-works-number" aria-hidden="true">
                  {item.step}
                </span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
          <div className="hero-ctas">
            <Button href="/pricing" variant="primary">
              View Packages
            </Button>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="featured-articles-heading">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">From the Community</span>
              <h2 id="featured-articles-heading">Featured Articles</h2>
            </div>
            <div className="grid grid-3">
              {featured.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="services-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">What We Do</span>
            <h2 id="services-heading">Services Built to Move the Needle</h2>
            <p>
              We combine three core disciplines — search, development, and
              content — into one connected growth strategy for your
              business.
            </p>
          </div>
          <div className="grid grid-3">
            {services.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-alt" aria-labelledby="why-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Why Green Pages</span>
            <h2 id="why-heading">Why Businesses Choose Us</h2>
            <p>
              We&apos;ve helped companies across industries turn organic
              search and content into a predictable growth channel.
            </p>
          </div>
          <div className="grid grid-2">
            {whyChooseUs.map((item) => (
              <div className="feature-item" key={item.title}>
                <span className="feature-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="cta-heading">
        <div className="container">
          <div className="cta-banner">
            <h2 id="cta-heading">Ready to Grow Your Business?</h2>
            <p>
              Talk to our team about your goals and get a free, no-obligation
              growth plan tailored to your business.
            </p>
            <div className="cta-actions">
              <Button href="/contact" variant="inverted">
                Get Your Free Consultation
              </Button>
              <Button href="/about" variant="secondarytwo">
                Learn About Us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
