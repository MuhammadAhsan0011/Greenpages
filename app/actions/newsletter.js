"use server";

import { createPublicClient } from "@/utils/supabase/public";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Footer newsletter signup. Insert-only, same pattern as contact_messages —
// no public read policy, so only the project owner can see subscribers via
// the Supabase Table Editor. Redirects back to whichever page the footer
// was submitted from (the footer appears on every page), using the
// referer header rather than a hardcoded path.
export async function subscribeToNewsletter(formData) {
  const email = formData.get("email")?.toString().trim();

  if (email) {
    const supabase = createPublicClient();
    await supabase.from("newsletter_subscribers").insert({ email });
  }

  const headersList = await headers();
  const referer = headersList.get("referer");
  let redirectPath = "/";
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      redirectPath = refererUrl.pathname;
    } catch {
      // keep default
    }
  }

  redirect(`${redirectPath}?subscribed=1#footer-newsletter`);
}
