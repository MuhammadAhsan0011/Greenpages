import ContactForm from "../components/ContactForm";

export const metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Green Pages to discuss your SEO, web development, or content marketing goals. Request a free consultation today.",
  alternates: {
    canonical: "/contact",
  },
};

// This page itself is a Server Component — only the interactive form
// inside it (ContactForm) needs to run on the client.
export default function ContactPage() {
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
          <ContactForm />

          <div>
            <h2>Other Ways to Reach Us</h2>
            <div className="contact-info-list">
              <div className="contact-info-item">
                <h3>Email</h3>
                <p>hello@greenpages.example</p>
              </div>
              <div className="contact-info-item">
                <h3>Phone</h3>
                <p>+1 (555) 010-2024</p>
              </div>
              <div className="contact-info-item">
                <h3>Office</h3>
                <p>Remote-first agency, serving clients worldwide.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
