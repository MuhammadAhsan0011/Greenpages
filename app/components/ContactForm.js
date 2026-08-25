"use client";

// This component MUST be a Client Component ("use client") because it uses
// React's useState hook to hold form field values and submission status,
// and it calls the Supabase browser client on submit — both are
// browser-only, interactive behaviors that cannot run in a Server
// Component. Every other page/component in this project stays a Server
// Component; this is one of the few deliberate, minimal exceptions.

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ContactForm({ defaultMessage = "" }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: defaultMessage,
  });
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("submitting");

    const supabase = createClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: formData.name,
      email: formData.email,
      message: formData.message,
    });

    if (error) {
      setStatus("error");
      return;
    }

    setStatus("success");
    setFormData({ name: "", email: "", message: "" });
  }

  if (status === "success") {
    return (
      <div className="form-success" role="status">
        Thanks for reaching out! Your message has been received and our team
        will get back to you within one business day.
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {status === "error" && (
        <p className="form-error">
          Something went wrong sending your message. Please try again.
        </p>
      )}

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

      <button type="submit" className="btn btn-primary" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
