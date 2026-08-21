"use client";

// This component MUST be a Client Component ("use client") because it uses
// React's useState hook to hold form field values and submission status,
// and it attaches an onSubmit event handler — both are browser-only,
// interactive behaviors that cannot run in a Server Component. Every other
// page/component in this project stays a Server Component; this is the one
// deliberate, minimal exception, kept as small and isolated as possible so
// the rest of the app ships zero unnecessary client-side JavaScript.

import { useState } from "react";

const initialFormState = {
  name: "",
  email: "",
  message: "",
};

export default function ContactForm() {
  const [formData, setFormData] = useState(initialFormState);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    // No backend is wired up in this starter project. In production, send
    // formData to an API route (e.g. app/api/contact/route.js) or a
    // third-party form/email service here.
    setSubmitted(true);
    setFormData(initialFormState);
  }

  if (submitted) {
    return (
      <div className="form-success" role="status">
        Thanks for reaching out! Your message has been received and our team
        will get back to you within one business day.
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={formData.name}
          onChange={handleChange}
        />
      </div>

      <div className="form-field">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div className="form-field">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          value={formData.message}
          onChange={handleChange}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Send Message
      </button>
    </form>
  );
}
