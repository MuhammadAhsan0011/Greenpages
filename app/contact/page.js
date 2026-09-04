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
  verified: "Verified (Rs. 2,000/month)",
  featured: "Premium (Rs. 4,500/month)",
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
              <div className="contact-info-item">
                <h3>Follow Us</h3>
                <div className="contact-social-links">
                  <a
                    href="https://www.facebook.com/greenpages.pk"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Green Pages on Facebook"
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M14 9h2.5V6h-2.5c-2.2 0-4 1.8-4 4v2H8v3h2v6h3v-6h2.5l.5-3H13v-2c0-.6.4-1 1-1Z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/greenpages.pk"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Green Pages on Instagram"
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="16.6" cy="7.4" r="1" fill="currentColor" />
                    </svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/company/green-pages-pk/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Green Pages on LinkedIn"
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="5" y="9" width="3" height="10" fill="currentColor" />
                      <circle cx="6.5" cy="5.5" r="1.8" fill="currentColor" />
                      <path
                        d="M11 9h3v1.6c.6-1 1.7-1.8 3.3-1.8 2.5 0 3.7 1.7 3.7 4.6V19h-3v-5.2c0-1.4-.5-2.4-1.8-2.4-1 0-1.6.7-1.9 1.3-.1.2-.1.6-.1 1V19h-3V9Z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/923032672509"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp contact-whatsapp-btn"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.9-2-.2-.6-.5-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1 0 1.2.9 2.4 1 2.6.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.2-.3-.2-.5-.3Z"
                />
                <path
                  fill="currentColor"
                  d="M12 2.5A9.5 9.5 0 0 0 3.4 16.4L2.5 21.5l5.2-1.4A9.5 9.5 0 1 0 12 2.5Zm0 17.3a7.8 7.8 0 0 1-4-1.1l-.3-.2-3.1.8.8-3-.2-.3A7.8 7.8 0 1 1 12 19.8Z"
                />
              </svg>
              Chat With Us on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
