"use server";

import { createClient } from "@/utils/supabase/server";
import { uploadPublicImage, deletePublicImage } from "@/utils/storage";
import { sanitizeArticleHtml } from "@/utils/sanitizeHtml";
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
  const position = formData.get("position")?.toString().trim() || null;
  const addressLine1 = formData.get("addressLine1")?.toString().trim() || null;
  const addressLine2 = formData.get("addressLine2")?.toString().trim() || null;
  const state = formData.get("state")?.toString().trim() || null;
  const country = formData.get("country")?.toString().trim() || null;
  const postalCode = formData.get("postalCode")?.toString().trim() || null;

  if (!name || !category || !description) {
    redirect(
      `/account/business?error=${encodeURIComponent(
        "Business name, category, and description are required."
      )}`
    );
  }

  // Keep the existing logo/social links/about content unless this plan is
  // actually allowed to change them — a Free-plan submission never carries
  // real values for the paid-only fields (they're not rendered as inputs),
  // so falling back to the existing row here avoids silently wiping them.
  const { data: existing } = await supabase
    .from("businesses")
    .select("logo_url, plan, facebook_url, instagram_url, linkedin_url, whatsapp_url, about_html")
    .eq("owner_id", user.id)
    .maybeSingle();

  const isPaidPlan = existing?.plan === "verified" || existing?.plan === "featured";

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
  } else if (formData.get("removeLogo") === "yes" && existing?.logo_url) {
    oldLogoUrl = existing.logo_url;
    logoUrl = null;
  }

  let facebookUrl = existing?.facebook_url ?? null;
  let instagramUrl = existing?.instagram_url ?? null;
  let linkedinUrl = existing?.linkedin_url ?? null;
  let whatsappUrl = existing?.whatsapp_url ?? null;
  let aboutHtml = existing?.about_html ?? null;

  if (isPaidPlan) {
    facebookUrl = formData.get("facebookUrl")?.toString().trim() || null;
    instagramUrl = formData.get("instagramUrl")?.toString().trim() || null;
    linkedinUrl = formData.get("linkedinUrl")?.toString().trim() || null;
    whatsappUrl = formData.get("whatsappUrl")?.toString().trim() || null;
    const rawAbout = formData.get("about")?.toString() ?? "";
    aboutHtml = rawAbout.trim() ? sanitizeArticleHtml(rawAbout) : null;
  }

  const { error } = await supabase.from("businesses").upsert(
    {
      owner_id: user.id,
      name,
      category,
      description,
      website,
      phone,
      city,
      logo_url: logoUrl,
      position,
      address_line1: addressLine1,
      address_line2: addressLine2,
      state,
      country,
      postal_code: postalCode,
      facebook_url: facebookUrl,
      instagram_url: instagramUrl,
      linkedin_url: linkedinUrl,
      whatsapp_url: whatsappUrl,
      about_html: aboutHtml,
    },
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
