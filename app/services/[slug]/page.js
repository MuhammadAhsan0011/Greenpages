import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "../../components/Button";
import { services, getServiceBySlug } from "../../data/services";

// Pre-renders /services/seo, /services/web-development, and
// /services/content-marketing at build time as static pages.
export async function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

// Dynamic per-page SEO metadata, generated from the matching service's data.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return {
      title: "Service Not Found",
    };
  }

  return {
    title: service.title,
    description: service.metaDescription,
    alternates: {
      canonical: `/services/${service.slug}`,
    },
    openGraph: {
      title: `${service.title} | GrowthPro`,
      description: service.metaDescription,
    },
  };
}

// Server Component — service content is static per slug and pre-rendered
// at build time, so no client-side JavaScript is needed to display it.
export default async function ServiceDetailPage({ params }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const relatedServices = service.relatedSlugs
    .map((relatedSlug) => getServiceBySlug(relatedSlug))
    .filter(Boolean);

  return (
    <>
      <section className="service-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/services">Services</Link> / {service.title}
          </p>
          <span className="service-detail-icon" aria-hidden="true">
            {service.icon}
          </span>
          <h1>{service.title}</h1>
          <p className="hero-description">{service.heroDescription}</p>
          <div className="hero-ctas">
            <Button href="/contact" variant="primary">
              Get a Free Consultation
            </Button>
            <Button href="/services" variant="secondary">
              View All Services
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="details-heading">
        <div className="container">
          <h2 id="details-heading" className="visually-hidden">
            {service.title} Details
          </h2>
          {service.sections.map((block) => (
            <article className="service-section" key={block.heading}>
              <h2>{block.heading}</h2>
              <p>{block.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-alt" aria-labelledby="benefits-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Benefits</span>
            <h2 id="benefits-heading">
              What You Get with {service.shortTitle}
            </h2>
          </div>
          <ul className="benefits-list">
            {service.benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="related-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Explore More</span>
            <h2 id="related-heading">Related Services</h2>
          </div>
          <nav className="related-links" aria-label="Related services">
            {relatedServices.map((related) => (
              <Link href={`/services/${related.slug}`} key={related.slug}>
                {related.title}
              </Link>
            ))}
            <Link href="/services">All Services</Link>
            <Link href="/about">About GrowthPro</Link>
          </nav>
        </div>
      </section>

      <section aria-labelledby="service-cta-heading">
        <div className="container">
          <div className="cta-banner">
            <h2 id="service-cta-heading">
              Ready to Get Started with {service.shortTitle}?
            </h2>
            <p>
              Talk to our team about your goals and get a free, tailored
              {" "}
              {service.shortTitle.toLowerCase()} strategy for your business.
            </p>
            <div className="cta-actions">
              <Button href="/contact" variant="inverted">
                Get Your Free Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
