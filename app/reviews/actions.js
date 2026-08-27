"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Anyone can submit a review — no sign-in required. Every submission starts
// unapproved (approved: false) and only becomes publicly visible once the
// admin approves it in /admin. Per-business reviews are a Featured-plan
// perk, re-checked here against the real plan (not just hidden in the UI) —
// the same rule is enforced again at the database level in
// supabase/schema.sql's insert policy, as defense in depth.
export async function submitReview(formData) {
  const supabase = await createClient();

  const reviewerName = formData.get("reviewerName")?.toString().trim();
  const rating = Number(formData.get("rating"));
  const message = formData.get("message")?.toString().trim();
  const businessId = formData.get("businessId")?.toString().trim() || null;
  const redirectTo = formData.get("redirectTo")?.toString() || "/reviews";

  if (!reviewerName || !message || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect(`${redirectTo}?reviewError=${encodeURIComponent("Please fill in your name, a rating, and a message.")}`);
  }

  if (businessId) {
    const { data: business } = await supabase
      .from("businesses")
      .select("plan")
      .eq("id", businessId)
      .maybeSingle();

    if (business?.plan !== "featured") {
      redirect(
        `${redirectTo}?reviewError=${encodeURIComponent(
          "This business hasn't unlocked customer reviews."
        )}`
      );
    }
  }

  const { error } = await supabase.from("reviews").insert({
    business_id: businessId,
    reviewer_name: reviewerName,
    rating,
    message,
    approved: false,
  });

  if (error) {
    redirect(`${redirectTo}?reviewError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(redirectTo);
  redirect(`${redirectTo}?reviewed=1`);
}

// Same logic as submitReview, but returns a result instead of redirecting —
// for the one caller (ReturnVisitorReviewPopup.js) that invokes this
// directly from client code rather than via a <form action> element. A
// Server Action called imperatively like that can't rely on redirect()
// being handled the way it is for a real form submission.
export async function submitReviewInline(formData) {
  const supabase = await createClient();

  const reviewerName = formData.get("reviewerName")?.toString().trim();
  const rating = Number(formData.get("rating"));
  const message = formData.get("message")?.toString().trim();

  if (!reviewerName || !message || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Please fill in your name, a rating, and a message." };
  }

  const { error } = await supabase.from("reviews").insert({
    business_id: null,
    reviewer_name: reviewerName,
    rating,
    message,
    approved: false,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/reviews");
  return { success: true };
}
