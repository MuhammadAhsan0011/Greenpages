"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signup(formData) {
  const fullName = formData.get("fullName")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  const agreedToTerms = formData.get("agreeTerms") === "yes";

  if (!fullName || !email || !password || !confirmPassword) {
    redirect(`/signup?error=${encodeURIComponent("All fields are required.")}`);
  }

  if (password !== confirmPassword) {
    redirect(`/signup?error=${encodeURIComponent("Passwords do not match.")}`);
  }

  if (!agreedToTerms) {
    redirect(
      `/signup?error=${encodeURIComponent("You must agree to the Terms & Conditions.")}`
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // If email confirmation is OFF in Supabase, signUp() returns an active
  // session immediately and the user is already logged in. If it's ON,
  // no session exists yet until they click the confirmation email link.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/account");
  }

  redirect("/signup/check-email");
}
