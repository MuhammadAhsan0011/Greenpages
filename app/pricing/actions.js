"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function requestUpgrade(plan, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/pricing");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect(
      `/account/business?error=${encodeURIComponent(
        "Create your business profile first, then request an upgrade from the Pricing page."
      )}`
    );
  }

  const { error } = await supabase
    .from("businesses")
    .update({ requested_plan: plan })
    .eq("owner_id", user.id);

  if (error) {
    redirect(`/pricing?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/account");
  redirect("/pricing?requested=1");
}

// Same request/approve flow as requestUpgrade above, but for the annual
// Publisher Plan (businesses.requested_publisher_plan) — a separate column
// from the business listing's requested_plan, approved independently in
// /admin.
export async function requestPublisherUpgrade(plan, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/pricing");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect(
      `/account/business?error=${encodeURIComponent(
        "Create your business profile first, then request a Publisher Plan upgrade."
      )}`
    );
  }

  const { error } = await supabase
    .from("businesses")
    .update({ requested_publisher_plan: plan })
    .eq("owner_id", user.id);

  if (error) {
    redirect(`/pricing?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/account");
  redirect("/pricing?publisherRequested=1#publisher-plans-heading");
}
