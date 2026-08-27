"use server";

import { createClient } from "@/utils/supabase/server";
import { uploadPublicImage, deletePublicImage } from "@/utils/storage";
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

  // Keep the existing logo unless a new file was actually selected.
  const { data: existing } = await supabase
    .from("businesses")
    .select("logo_url")
    .eq("owner_id", user.id)
    .maybeSingle();

  let logoUrl = existing?.logo_url ?? null;
  let oldLogoUrl = null;

  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    const upload = await uploadPublicImage(supabase, logoFile, "business-logos", user.id);
    if (upload.error) {
      redirect(`/account/business?error=${encodeURIComponent(upload.error.message)}`);
    }
    oldLogoUrl = existing?.logo_url ?? null;
    logoUrl = upload.url;
  }

  const { error } = await supabase.from("businesses").upsert(
    { owner_id: user.id, name, category, description, website, phone, city, logo_url: logoUrl },
    { onConflict: "owner_id" }
  );

  if (error) {
    redirect(`/account/business?error=${encodeURIComponent(error.message)}`);
  }

  // Only delete the old file once the new one is safely saved, so a failed
  // upsert never leaves the business with no logo at all.
  if (oldLogoUrl) {
    await deletePublicImage(supabase, oldLogoUrl);
  }

  revalidatePath("/account");
  revalidatePath("/businesses");
  redirect("/account");
}

// Deletes the signed-in user's business logo, both the DB reference and the
// physical file in Storage, so removed logos don't linger in the bucket.
export async function removeBusinessLogo() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("logo_url")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (business?.logo_url) {
    await supabase
      .from("businesses")
      .update({ logo_url: null })
      .eq("owner_id", user.id);

    await deletePublicImage(supabase, business.logo_url);
  }

  revalidatePath("/account");
  revalidatePath("/businesses");
  redirect("/account/business");
}
