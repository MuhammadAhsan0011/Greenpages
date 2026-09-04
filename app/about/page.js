import Image from "next/image";
import Button from "../components/Button";
import aboutHeroPhoto from "../../public/images/about-hero-photo.png";

export const metadata = {
  title: "About Green Pages",
  description:
    "Learn about Green Pages' mission, values, and the team behind our SEO, web development, and content marketing services.",
  alternates: {
    canonical: "/about",
  },
};

const whyChooseUs = [
  {
    title: "Proven Track Record",
    description:
      "We've partnered with businesses across SaaS, e-commerce, and professional services to deliver measurable organic growth.",
  },
  {
    title: "Specialist Team",
    description:
      "Our SEO strategists, developers, and content writers work together under one roof, not as disconnected freelancers.",
  },
  {
    title: "Long-Term Thinking",
    description:
      "We build strategies designed to compound over months and years, not short-lived tactics that stop working the moment you do.",
  },
];

// Server Component — static marketing content with no client interactivity.
export default function AboutPage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="hero-eyebrow">About Green Pages</span>
            <h1>We Help Businesses Grow Through Smarter Digital Marketing</h1>
            <p className="hero-description">
              Green Pages is a digital marketing agency built around one goal:
              turning your website into your most reliable source of
              customers. We combine SEO, web development, and content
              marketing into a single, connected growth strategy.
            </p>
            <div className="hero-ctas">
              <Button href="/contact" variant="primary">
                Work With Us
              </Button>
              <Button href="/services" variant="secondary">
                See Our Services
              </Button>
            </div>
          </div>
          <div className="hero-image">
            <Image
              src={aboutHeroPhoto}
              alt="Illustration of a business owner working on a laptop overlooking a green, growing Pakistani skyline"
              priority
              sizes="(max-width: 900px) 100vw, 560px"
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="mission-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Our Mission</span>
            <h2 id="mission-heading">Making Sustainable Growth Accessible</h2>
            <p>
              Our mission is to make sustainable, organic growth accessible
              to businesses of every size. Too many companies pour budget
              into short-term ads while their organic presence — the channel
              that compounds in value over time — goes unmanaged. We exist
              to fix that.
            </p>
            <p>
              We measure our success by one thing: whether our work moves
              the metrics that matter to your business, from qualified
              traffic to real revenue.
            </p>
          </div>
        </div>
      </section>

      <section className="section-alt" aria-labelledby="why-us-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Why Choose Us</span>
            <h2 id="why-us-heading">What Sets Green Pages Apart</h2>
          </div>
          <div className="grid grid-3">
            {whyChooseUs.map((item) => (
              <article className="card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="about-cta-heading">
        <div className="container">
          <div className="cta-banner">
            <h2 id="about-cta-heading">Let&apos;s Build Your Growth Plan</h2>
            <p>
              Tell us about your business goals and we&apos;ll show you
              exactly how Green Pages can help you get there.
            </p>
            <div className="cta-actions">
              <Button href="/contact" variant="inverted">
                Contact Our Team
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
