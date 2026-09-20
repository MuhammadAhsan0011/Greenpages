"use server";

import sharp from "sharp";
import { createClient } from "@/utils/supabase/server";
import { uploadPublicImage, deletePublicImage } from "@/utils/storage";
import { sanitizeArticleHtml } from "@/utils/sanitizeHtml";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getParent, getChild } from "../data/businessCategories";

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Plain "business-name" when that's free; only falls back to "business-
// name-2", "-3", etc. on an actual collision, so most listings get a
// clean URL instead of an always-on random suffix.
async function generateUniqueBusinessSlug(supabase, name) {
  const base = slugify(name);
  let candidate = base;
  let attempt = 2;
  while (true) {
    const { data } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${attempt}`;
    attempt += 1;
  }
}

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

// The cover image's own display spots (homepage/business card banner) show
// it with object-fit: contain — see FeaturedBusinessCard.js — so a too-thin
// or too-small image never gets cropped, just letterboxed. These minimums
// exist to reject anything that would look cramped or blurry once fit in,
// not to prevent cropping (contain already does that).
const MIN_COVER_WIDTH = 800;
const MIN_COVER_HEIGHT = 400;
const MIN_COVER_ASPECT_RATIO = 1.3;

// Shared by validatePhotoDimensions and validateCoverImageDimensions below
// — reads the real pixel size server-side so a direct form post can't skip
// the equivalent client-side check. Reading the file here doesn't consume
// it — the caller can still pass the same File to uploadPublicImage after.
async function validateImageDimensions(file, { minWidth, minHeight, minAspectRatio, label }) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { width, height } = await sharp(buffer).metadata();
  if (!width || !height || width < minWidth || height < minHeight) {
    return `"${file.name}" is ${width ?? "?"}×${height ?? "?"}px — ${label} need to be at least ${minWidth}×${minHeight}px.`;
  }
  if (width / height < minAspectRatio) {
    return `"${file.name}" is ${width}×${height}px — that's too tall/square and would look cramped. Upload a landscape image (at least ${minAspectRatio}:1 wide).`;
  }
  return null;
}

function validatePhotoDimensions(file) {
  return validateImageDimensions(file, {
    minWidth: MIN_PHOTO_WIDTH,
    minHeight: MIN_PHOTO_HEIGHT,
    minAspectRatio: MIN_PHOTO_ASPECT_RATIO,
    label: "photos",
  });
}

function validateCoverImageDimensions(file) {
  return validateImageDimensions(file, {
    minWidth: MIN_COVER_WIDTH,
    minHeight: MIN_COVER_HEIGHT,
    minAspectRatio: MIN_COVER_ASPECT_RATIO,
    label: "cover images",
  });
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

export async function upsertBusiness(nextStep, formData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name")?.toString().trim();
  // The form submits taxonomy slugs (see CategorySubcategoryFields.js), not
  // free text — resolved and validated against the real taxonomy below,
  // never trusted as-is. A stale tab or a hand-crafted request can still
  // send anything in these two fields, so this has to be the place that
  // actually enforces it, not the <select> in the form.
  const categorySlug = formData.get("category")?.toString().trim();
  const subcategorySlug = formData.get("subcategory")?.toString().trim();
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
  // Only present on a brand-new listing's "Choose Your Plan" step (see
  // account/business/page.js) — editing an existing business never submits
  // this field, so it's undefined there and never overwrites a real
  // requested_plan set later via /pricing.
  const requestedPlanChoice = formData.get("requestedPlan")?.toString().trim();
  const features = formData.getAll("features").filter(Boolean).join(", ") || null;
  const businessHours = readBusinessHours(formData);

  if (!name || !description) {
    redirect(
      `/account/business?error=${encodeURIComponent(
        "Business name and description are required."
      )}`
    );
  }

  // category must resolve to a real parent in the taxonomy; subcategory,
  // if present, must be a real child OF that specific parent — not just
  // any valid slug elsewhere in the tree. Reject rather than silently
  // coercing to a default or dropping the value, so a bad submission
  // never quietly becomes bad data.
  const categoryParent = categorySlug ? getParent(categorySlug) : null;
  if (!categoryParent) {
    redirect(
      `/account/business?error=${encodeURIComponent("Please choose a valid business category.")}`
    );
  }

  let subcategory = null;
  if (subcategorySlug) {
    const categoryChild = getChild(categorySlug, subcategorySlug);
    if (!categoryChild) {
      redirect(
        `/account/business?error=${encodeURIComponent(
          "Please choose a valid subcategory for the selected category, or leave it blank."
        )}`
      );
    }
    subcategory = categoryChild.name;
  }

  const category = categoryParent.name;

  // Keep the existing logo/social links/about content unless this plan is
  // actually allowed to change them — a Free-plan submission never carries
  // real values for the paid-only fields (they're not rendered as inputs),
  // so falling back to the existing row here avoids silently wiping them.
  const { data: existing } = await supabase
    .from("businesses")
    .select(
      "slug, logo_url, cover_image_url, photos, plan, facebook_url, instagram_url, linkedin_url, whatsapp_url, about_html"
    )
    .eq("owner_id", user.id)
    .maybeSingle();

  const isPaidPlan = existing?.plan === "verified" || existing?.plan === "featured";

  // Generated once, on first creation, and never touched again — even if
  // the name changes later, so a shared /businesses/[slug] link never
  // breaks.
  const slug = existing?.slug ?? (await generateUniqueBusinessSlug(supabase, name));

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
    const coverDimensionIssue = await validateCoverImageDimensions(coverFile);
    if (coverDimensionIssue) {
      redirect(`/account/business?error=${encodeURIComponent(coverDimensionIssue)}`);
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

  // Picking Verified/Premium on a brand-new listing's plan step sends the
  // upgrade request together with the listing itself — same requested_plan
  // column /pricing's requestUpgrade() uses, so it shows up in /admin's
  // Pending Articles-style approval queue exactly the same way. Only
  // applies on first creation (never overwrites an existing business's
  // requested_plan, e.g. one already set or cleared via /pricing).
  const isNewRequestedPlan =
    !existing && (requestedPlanChoice === "verified" || requestedPlanChoice === "featured");

  const { error } = await supabase.from("businesses").upsert(
    {
      owner_id: user.id,
      slug,
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
      ...(isNewRequestedPlan ? { requested_plan: requestedPlanChoice } : {}),
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
  // A bound nextStep means this was an intermediate "Save & Continue" click
  // while editing an existing business — land back on the wizard at that
  // step instead of bouncing out to the dashboard.
  redirect(nextStep ? `/account/business?step=${nextStep}` : "/account");
}
