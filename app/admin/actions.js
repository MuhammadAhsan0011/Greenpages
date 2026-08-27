"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  return supabase;
}

// Approves a pending request: copies requested_plan into plan and clears
// the request. businessId/plan are pre-bound to the form action (see
// app/admin/page.js), so the submitted form only needs to identify itself.
export async function approveUpgrade(businessId, plan) {
  const supabase = await requireAdmin();

  await supabase
    .from("businesses")
    .update({ plan, requested_plan: null })
    .eq("id", businessId);

  revalidatePath("/admin");
  revalidatePath("/businesses");
}

// Declines a pending request without changing the current plan.
export async function dismissRequest(businessId) {
  const supabase = await requireAdmin();

  await supabase.from("businesses").update({ requested_plan: null }).eq("id", businessId);

  revalidatePath("/admin");
}

// Manual override — set any business's plan directly, for corrections or
// upgrades arranged outside the normal request flow.
export async function setPlan(formData) {
  const supabase = await requireAdmin();

  const businessId = formData.get("businessId")?.toString();
  const plan = formData.get("plan")?.toString();

  if (!businessId || !["free", "verified", "featured"].includes(plan)) {
    return;
  }

  await supabase
    .from("businesses")
    .update({ plan, requested_plan: null })
    .eq("id", businessId);

  revalidatePath("/admin");
  revalidatePath("/businesses");
}

// Makes a pending review publicly visible.
export async function approveReview(reviewId, businessId) {
  const supabase = await requireAdmin();

  await supabase.from("reviews").update({ approved: true }).eq("id", reviewId);

  revalidatePath("/admin");
  revalidatePath("/reviews");
  revalidatePath("/");
  if (businessId) {
    revalidatePath(`/businesses/${businessId}`);
  }
}

// Deletes a pending review instead of approving it.
export async function dismissReview(reviewId) {
  const supabase = await requireAdmin();

  await supabase.from("reviews").delete().eq("id", reviewId);

  revalidatePath("/admin");
}
