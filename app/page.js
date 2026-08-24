import Image from "next/image";
import Button from "./components/Button";
import ServiceCard from "./components/ServiceCard";
import { services } from "./data/services";
import heroIllustration from "../public/images/hero-illustration.svg";

export const metadata = {
  title: "Digital Marketing Agency for SEO, Web & Content Growth",
  description:
    "Green Pages is a digital marketing agency helping ambitious businesses grow through SEO, web development, and content marketing. Get a free consultation today.",
  alternates: {
    canonical: "/",
  },
};

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
export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="hero-eyebrow">Digital Marketing Agency</span>
            <h1>Grow Your Business with Data-Driven Digital Marketing</h1>
            <p className="hero-description">
              Green Pages helps ambitious companies attract more traffic,
              generate qualified leads, and grow revenue through expert SEO,
              modern web development, and strategic content marketing.
            </p>
            <div className="hero-ctas">
              <Button href="/contact" variant="primary">
                Get a Free Consultation
              </Button>
              <Button href="/services" variant="secondary">
                Explore Our Services
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
              <Button href="/about" variant="secondary">
                Learn About Us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
