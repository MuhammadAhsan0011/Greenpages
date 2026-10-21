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
// Publisher Plan — kept on the user's author_profiles row (not the business),
// so it works without a business listing. A database trigger pins the actual
// plan to what the admin approved; the user can only ever set the request.
export async function requestPublisherUpgrade(plan, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/pricing");
  }

  if (plan !== "featured" && plan !== "sponsored") {
    redirect("/pricing#publisher-plans-heading");
  }

  const { error } = await supabase
    .from("author_profiles")
    .upsert(
      { user_id: user.id, requested_publisher_plan: plan, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) {
    redirect(`/pricing?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/account");
  revalidatePath("/admin");
  redirect("/pricing?publisherRequested=1#publisher-plans-heading");
}
