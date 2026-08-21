"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function upsertBusiness(formData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name")?.toString().trim();
  const category = formData.get("category")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const website = formData.get("website")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;
  const city = formData.get("city")?.toString().trim() || null;

  if (!name || !category || !description) {
    redirect(
      `/account/business?error=${encodeURIComponent(
        "Business name, category, and description are required."
      )}`
    );
  }

  const { error } = await supabase
    .from("businesses")
    .upsert(
      { owner_id: user.id, name, category, description, website, phone, city },
      { onConflict: "owner_id" }
    );

  if (error) {
    redirect(`/account/business?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/account");
  revalidatePath("/businesses");
  redirect("/account");
}
