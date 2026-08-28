"use server";

import { createPublicClient } from "@/utils/supabase/public";

const NOTIFICATION_EMAIL = "greenpages.pk.com@gmail.com";

// Called directly from the ContactForm Client Component. Runs entirely on
// the server, so RESEND_API_KEY is never exposed to the browser bundle —
// that's the reason this submission logic isn't just a plain fetch call
// from the client.
export async function submitContactMessage({ name, email, message }) {
  const supabase = createPublicClient();
  const { error: dbError } = await supabase
    .from("contact_messages")
    .insert({ name, email, message });

  let emailSent = false;
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Green Pages Contact Form <onboarding@resend.dev>",
          to: NOTIFICATION_EMAIL,
          reply_to: email,
          subject: `New contact form message from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        }),
      });
      emailSent = response.ok;
    } catch {
      emailSent = false;
    }
  }

  // Success as long as at least one delivery path worked, so a temporary
  // outage on one side doesn't lose the submission entirely.
  if (dbError && !emailSent) {
    return { success: false };
  }

  return { success: true };
}
