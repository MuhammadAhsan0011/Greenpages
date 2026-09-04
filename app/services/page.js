import Image from "next/image";
import Link from "next/link";
import ServiceCard from "../components/ServiceCard";
import Button from "../components/Button";
import { services } from "../data/services";
import servicesHeroPhoto from "../../public/images/services-hero-photo.png";

export const metadata = {
  title: "Our Services",
  description:
    "Explore Green Pages' business directory listings and digital marketing services, including SEO, web development, and content marketing.",
  alternates: {
    canonical: "/services",
  },
};

// Directory-side offerings, shown alongside the agency services below —
// these link straight to the relevant flow rather than a detail page,
// since (unlike SEO/Web Dev/Content Marketing) they don't have one.
const directoryOfferings = [
  {
    icon: "🏢",
    title: "Business Listing",
    description:
      "List your business free and get discovered by thousands of potential customers.",
    href: "/signup",
    ctaLabel: "Learn More",
  },
  {
    icon: "📍",
    ribbon: "Popular",
    title: "Premium Listing",
    description:
      "Get more visibility with our Verified/Premium listing plans and stand out from the crowd.",
    href: "/pricing",
    ctaLabel: "Learn More",
  },
  {
    icon: "📝",
    title: "Article Submission",
    description:
      "Share your expertise and promote your brand by publishing articles on Green Pages PK.",
    href: "/account/articles/new",
    ctaLabel: "Learn More",
  },
];

const whyChooseServices = [
  {
    title: "Trusted Platform",
    description: "Join businesses already listed across Pakistan.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Larger Audience",
    description: "Connect with real local customers.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="17" cy="9" r="2.6" stroke="currentColor" strokeWidth="1.8" />
        <path d="M15.5 13.2c2.5.3 4.5 2.4 4.5 5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Quick & Easy",
    description: "Get listed in under 3 minutes.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Grow Faster",
    description: "More visibility means more business.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 18V9M10 18V5M16 18v-7M22 5l-6 6-4-4-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "100% Free to Start",
    description: "List your business without any cost.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const serviceSteps = [
  {
    step: "1",
    icon: "🧭",
    title: "Choose a Service",
    description: "Select the option that fits your business needs.",
  },
  {
    step: "2",
    icon: "📋",
    title: "Submit Details",
    description: "Add your business information in just a few clicks.",
  },
  {
    step: "3",
    icon: "📈",
    title: "Grow Your Business",
    description: "Get more visibility, leads, and customers across Pakistan.",
  },
];

// Server Component — the entire listing is derived from the shared
// services data, so no client-side state or interactivity is required.
export default function ServicesPage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="breadcrumbs">
              <Link href="/">Home</Link> / Services
            </p>
            <span className="hero-eyebrow">Our Services</span>
            <h1>
              Powerful Solutions to <span className="text-accent">Grow Your Business</span>
            </h1>
            <p className="hero-description">
              Green Pages PK offers simple and effective services to help
              businesses get discovered, build credibility, and reach more
              customers across Pakistan.
            </p>
          </div>
          <div className="hero-image">
            <Image
              src={servicesHeroPhoto}
              alt="A laptop displaying the Green Pages PK directory, surrounded by icons for listings, location, growth, and ratings"
              priority
              sizes="(max-width: 900px) 100vw, 560px"
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="services-list-heading">
        <div className="container">
          <h2 id="services-list-heading" className="visually-hidden">
            All Services
          </h2>
          <div className="grid grid-3">
            {directoryOfferings.map((offering) => (
              <article className="service-card" key={offering.title}>
                {offering.ribbon && <span className="service-ribbon">{offering.ribbon}</span>}
                <span className="service-icon-square" aria-hidden="true">
                  {offering.icon}
                </span>
                <h3>{offering.title}</h3>
                <p>{offering.description}</p>
                <Link href={offering.href} className="service-link">
                  {offering.ctaLabel} →
                </Link>
              </article>
            ))}
            {services.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-alt" aria-labelledby="why-services-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Why Choose Our Services</span>
            <h2 id="why-services-heading">The Smart Choice for Every Business</h2>
          </div>
          <div className="why-choose-row">
            {whyChooseServices.map((item) => (
              <div className="why-choose-item" key={item.title}>
                <span className="why-choose-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="services-how-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">How It Works</span>
            <h2 id="services-how-heading">Get Started in 3 Easy Steps</h2>
          </div>
          <div className="how-it-works-circles">
            {serviceSteps.map((item) => (
              <div className="how-it-works-circle-step" key={item.step}>
                <span className="how-it-works-circle" aria-hidden="true">
                  {item.icon}
                  <span className="how-it-works-circle-number">{item.step}</span>
                </span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-alt" aria-labelledby="services-cta-heading">
        <div className="container">
          <div className="skyline-banner">
            <div className="skyline-banner-content">
              <h2 id="services-cta-heading">Take Your Business to the Next Level</h2>
              <p>Use Green Pages PK services and connect with more customers today.</p>
              <div className="skyline-banner-actions">
                <Button href="/signup" variant="inverted">
                  Get Started Now →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
