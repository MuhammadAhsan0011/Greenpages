import ContactForm from "../components/ContactForm";

export const metadata = {
  title: { absolute: "Contact Green Pages | Karachi Marketing Agency" },
  description:
    "Reach Green Pages' Karachi team for SEO, web development, content marketing, or listing support.",
  alternates: {
    canonical: "/contact",
  },
};

const PACKAGE_LABELS = {
  verified: "Silver (Rs. 2,000/month)",
  featured: "Gold (Rs. 4,500/month)",
};

// This page itself is a Server Component — only the interactive form
// inside it (ContactForm) needs to run on the client.
export default async function ContactPage({ searchParams }) {
  const params = await searchParams;
  const packageLabel = PACKAGE_LABELS[params?.package];

  return (
    <section aria-labelledby="contact-heading">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Contact Us</span>
          <h1 id="contact-heading">Let&apos;s Talk About Your Growth Goals</h1>
          <p>
            Fill out the form below and a member of our team will get back
            to you within one business day with next steps.
          </p>
        </div>

        <div className="contact-layout">
          <ContactForm
            defaultMessage={
              packageLabel
                ? `I'd like to upgrade my listing to the ${packageLabel} package.`
                : ""
            }
          />

          <div>
            <h2>Other Ways to Reach Us</h2>
            <div className="contact-info-list">
              <div className="contact-info-item">
                <h3>Email</h3>
                <p>greenpages.pk.com@gmail.com</p>
              </div>
              <div className="contact-info-item">
                <h3>Phone</h3>
                <p>+92 303 2672509</p>
              </div>
              <div className="contact-info-item">
                <h3>Office</h3>
                <p>Karachi, Pakistan — serving clients nationwide.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
