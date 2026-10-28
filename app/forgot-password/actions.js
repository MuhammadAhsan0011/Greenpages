"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/site-url";

export async function requestPasswordReset(formData) {
  const email = formData.get("email")?.toString().trim();

  if (!email) {
    redirect(`/forgot-password?error=${encodeURIComponent("Email is required.")}`);
  }

  const headersList = await headers();
  const origin = getSiteUrl(headersList);

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  // Always show the same success message regardless of whether the email
  // is actually registered, so this can't be used to check which emails
  // have an account.
  redirect("/forgot-password?sent=1");
}
