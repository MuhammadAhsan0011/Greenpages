import ServiceCard from "../components/ServiceCard";
import Button from "../components/Button";
import { services } from "../data/services";

export const metadata = {
  title: "Our Services",
  description:
    "Explore Green Pages' digital marketing services, including SEO, web development, and content marketing — each built to drive measurable growth.",
  alternates: {
    canonical: "/services",
  },
};

// Server Component — the entire listing is derived from the shared
// services data, so no client-side state or interactivity is required.
export default function ServicesPage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="hero-eyebrow">Our Services</span>
          <h1>Digital Marketing Services That Drive Real Growth</h1>
          <p className="hero-description">
            From technical SEO to full website builds and ongoing content
            strategy, every Green Pages service is designed to work together
            as one connected growth engine for your business.
          </p>
        </div>
      </section>

      <section aria-labelledby="services-list-heading">
        <div className="container">
          <h2 id="services-list-heading" className="visually-hidden">
            All Services
          </h2>
          <div className="grid grid-3">
            {services.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-alt" aria-labelledby="services-cta-heading">
        <div className="container">
          <div className="cta-banner">
            <h2 id="services-cta-heading">Not Sure Where to Start?</h2>
            <p>
              Book a free consultation and we&apos;ll recommend the right
              mix of services for your goals and budget.
            </p>
            <div className="cta-actions">
              <Button href="/contact" variant="inverted">
                Get a Free Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
