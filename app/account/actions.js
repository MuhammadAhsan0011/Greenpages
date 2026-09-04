"use server";

import sharp from "sharp";
import { createClient } from "@/utils/supabase/server";
import { uploadPublicImage, deletePublicImage } from "@/utils/storage";
import { sanitizeArticleHtml } from "@/utils/sanitizeHtml";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_PHOTOS = 5;
const MIN_PHOTO_WIDTH = 800;
const MIN_PHOTO_HEIGHT = 600;
// The gallery frame displays at roughly 1.6:1 (landscape) and crops
// anything else to fill it — requiring at least a 4:3-ish shape here means
// a portrait or square photo never gets its edges cut off in the gallery.
const MIN_PHOTO_ASPECT_RATIO = 1.3;

// Backstops PhotoDropzone.js's client-side dimension/aspect-ratio check —
// reads the real pixel size server-side so a direct form post can't skip
// it. Reading the file here doesn't consume it — the caller can still pass
// the same File to uploadPublicImage afterward.
async function validatePhotoDimensions(file) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { width, height } = await sharp(buffer).metadata();
  if (!width || !height || width < MIN_PHOTO_WIDTH || height < MIN_PHOTO_HEIGHT) {
    return `"${file.name}" is ${width ?? "?"}×${height ?? "?"}px — photos need to be at least ${MIN_PHOTO_WIDTH}×${MIN_PHOTO_HEIGHT}px.`;
  }
  if (width / height < MIN_PHOTO_ASPECT_RATIO) {
    return `"${file.name}" is ${width}×${height}px — that's too tall/square and would get cropped. Upload a landscape photo (at least ${MIN_PHOTO_ASPECT_RATIO}:1 wide, e.g. 1000×750px).`;
  }
  return null;
}

// Backstops ImageUploadField.js's client-side check — a friendly, specific
// message either way, rather than surfacing a raw Storage API error for
// whichever file slipped through (e.g. a direct form post that skips the
// client component entirely).
function validateImageFile(file, label) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `${label}: only PNG, JPG, WebP, or GIF images are accepted (that file was ${file.type || "an unsupported type"}).`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${label}: that file is ${(file.size / (1024 * 1024)).toFixed(1)}MB — the limit is 5MB.`;
  }
  return null;
}

// Only days the owner actually touched (marked closed, or filled in both a
// start and end time) end up in the saved object — an untouched day is
// left out entirely rather than saved as a fabricated "00:00-00:00".
function readBusinessHours(formData) {
  const hours = {};
  let hasAny = false;
  for (const day of DAY_KEYS) {
    const closed = formData.get(`hours_${day}_closed`) === "yes";
    const open = formData.get(`hours_${day}_open`)?.toString().trim() || "";
    const close = formData.get(`hours_${day}_close`)?.toString().trim() || "";
    if (closed || (open && close)) {
      hours[day] = { open, close, closed };
      hasAny = true;
    }
  }
  return hasAny ? hours : null;
}

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
  const subcategory = formData.get("subcategory")?.toString().trim() || null;
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
  const tags = formData.get("tags")?.toString().trim() || null;
  const features = formData.getAll("features").filter(Boolean).join(", ") || null;
  const businessHours = readBusinessHours(formData);

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
    .select(
      "logo_url, cover_image_url, photos, plan, facebook_url, instagram_url, linkedin_url, whatsapp_url, about_html"
    )
    .eq("owner_id", user.id)
    .maybeSingle();

  const isPaidPlan = existing?.plan === "verified" || existing?.plan === "featured";

  let logoUrl = existing?.logo_url ?? null;
  let oldLogoUrl = null;

  const logoFile = formData.get("logo");
  if (logoFile instanceof File && logoFile.size > 0) {
    const logoIssue = validateImageFile(logoFile, "Business Logo");
    if (logoIssue) {
      redirect(`/account/business?error=${encodeURIComponent(logoIssue)}`);
    }
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

  let coverImageUrl = existing?.cover_image_url ?? null;
  let oldCoverImageUrl = null;

  const coverFile = formData.get("coverImage");
  if (coverFile instanceof File && coverFile.size > 0) {
    const coverIssue = validateImageFile(coverFile, "Cover Image");
    if (coverIssue) {
      redirect(`/account/business?error=${encodeURIComponent(coverIssue)}`);
    }
    const upload = await uploadPublicImage(supabase, coverFile, "business-covers", user.id);
    if (upload.error) {
      redirect(`/account/business?error=${encodeURIComponent(upload.error.message)}`);
    }
    oldCoverImageUrl = existing?.cover_image_url ?? null;
    coverImageUrl = upload.url;
  } else if (formData.get("removeCoverImage") === "yes" && existing?.cover_image_url) {
    oldCoverImageUrl = existing.cover_image_url;
    coverImageUrl = null;
  }

  // Gallery photos — separate from logo/cover, capped at MAX_PHOTOS. The
  // dropzone reports which existing photos the owner kept via a hidden
  // "existingPhotos" field; anything from the old list that isn't in that
  // set gets its storage file cleaned up below, same as logo/cover.
  const existingPhotoUrls = (existing?.photos ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
  const keptPhotoUrls = (formData.get("existingPhotos")?.toString() ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)
    .filter((url) => existingPhotoUrls.includes(url));
  const newPhotoFiles = formData.getAll("photos").filter((f) => f instanceof File && f.size > 0);

  if (keptPhotoUrls.length + newPhotoFiles.length > MAX_PHOTOS) {
    redirect(
      `/account/business?error=${encodeURIComponent(`You can only have ${MAX_PHOTOS} photos on your listing.`)}`
    );
  }

  const newPhotoUrls = [];
  for (const file of newPhotoFiles) {
    const photoIssue = validateImageFile(file, "Business Photo");
    if (photoIssue) {
      redirect(`/account/business?error=${encodeURIComponent(photoIssue)}`);
    }
    const dimensionIssue = await validatePhotoDimensions(file);
    if (dimensionIssue) {
      redirect(`/account/business?error=${encodeURIComponent(dimensionIssue)}`);
    }
    const upload = await uploadPublicImage(supabase, file, "business-photos", user.id);
    if (upload.error) {
      redirect(`/account/business?error=${encodeURIComponent(upload.error.message)}`);
    }
    newPhotoUrls.push(upload.url);
  }

  const finalPhotoUrls = [...keptPhotoUrls, ...newPhotoUrls];
  const photos = finalPhotoUrls.length > 0 ? finalPhotoUrls.join(", ") : null;
  const removedPhotoUrls = existingPhotoUrls.filter((url) => !keptPhotoUrls.includes(url));

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
      subcategory,
      description,
      website,
      phone,
      city,
      logo_url: logoUrl,
      cover_image_url: coverImageUrl,
      photos,
      position,
      address_line1: addressLine1,
      address_line2: addressLine2,
      state,
      country,
      postal_code: postalCode,
      tags,
      features,
      business_hours: businessHours,
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

  // Only delete the old files once the new row is safely saved, so a
  // failed upsert never leaves the business with a missing image.
  if (oldLogoUrl) {
    await deletePublicImage(supabase, oldLogoUrl);
  }
  if (oldCoverImageUrl) {
    await deletePublicImage(supabase, oldCoverImageUrl);
  }
  for (const url of removedPhotoUrls) {
    await deletePublicImage(supabase, url);
  }

  revalidatePath("/account");
  revalidatePath("/businesses");
  redirect("/account");
}
