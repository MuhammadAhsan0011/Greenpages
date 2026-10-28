"use server";

import sharp from "sharp";
import { createClient } from "@/utils/supabase/server";
import { uploadPublicImage, deletePublicImage } from "@/utils/storage";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  MAX_PRODUCT_IMAGES,
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_PRODUCT_DESCRIPTION_CHARS,
  PRODUCT_IMAGE_TYPES,
  PRODUCT_CATEGORIES,
  PRODUCT_AVAILABILITY,
  PRODUCT_CONDITIONS,
} from "../data/productOptions";

const MIN_IMAGE_SIDE = 300;

// Pasted text can carry non-breaking spaces — same reasoning as the
// identical helper in app/jobs/actions.js.
function normalizeSpaces(text) {
  return text.replace(/ /g, " ").replace(/ {2,}/g, " ").trim();
}

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

// Plain "product-title" when free; "-2", "-3"… only on a real collision.
async function generateUniqueProductSlug(supabase, title) {
  const base = slugify(title) || "product";
  let candidate = base;
  let attempt = 2;
  while (true) {
    const { data } = await supabase.from("products").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${attempt}`;
    attempt += 1;
  }
}

function isValidUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// The 1MB / 5-image limits are enforced HERE, not just in the form —
// PhotoDropzone.js can be bypassed by a direct form post. Also confirms the
// bytes really decode as an image (a renamed .exe has a fake image/* type).
async function validateProductImage(file) {
  if (!PRODUCT_IMAGE_TYPES.includes(file.type)) {
    return `"${file.name}": only JPG, PNG, or WebP images are accepted.`;
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB — each image must be 1MB or smaller.`;
  }
  try {
    const { width, height } = await sharp(Buffer.from(await file.arrayBuffer())).metadata();
    if (!width || !height || width < MIN_IMAGE_SIDE || height < MIN_IMAGE_SIDE) {
      return `"${file.name}" is too small (${width ?? "?"}×${height ?? "?"}px) — images must be at least ${MIN_IMAGE_SIDE}×${MIN_IMAGE_SIDE}px.`;
    }
  } catch {
    return `"${file.name}" couldn't be read as an image.`;
  }
  return null;
}

// Shared by createProduct and updateProduct so the two can never disagree
// about what a valid product is. Returns { error } or { fields }.
function parseProductFields(formData) {
  const fail = (message) => ({ error: message });

  const title = normalizeSpaces(formData.get("title")?.toString() ?? "").slice(0, 150);
  const companyName = normalizeSpaces(formData.get("companyName")?.toString() ?? "").slice(0, 150);
  const category = formData.get("category")?.toString().trim() ?? "";
  const availability = formData.get("availability")?.toString().trim() ?? "";
  const condition = formData.get("condition")?.toString().trim() ?? "";
  const description = (formData.get("description")?.toString() ?? "").trim();
  const productLink = formData.get("productLink")?.toString().trim() || null;
  const tags = formData.get("tags")?.toString().trim().slice(0, 300) || null;
  const city = normalizeSpaces(formData.get("city")?.toString() ?? "").slice(0, 100) || null;
  const address = normalizeSpaces(formData.get("address")?.toString() ?? "").slice(0, 200) || null;
  const whatsapp = formData.get("whatsappUrl")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;

  if (!title) return fail("Product name is required.");
  if (!companyName) return fail("Company / seller name is required.");
  if (!PRODUCT_CATEGORIES.some((c) => c.value === category)) return fail("Please choose a category.");
  if (!PRODUCT_AVAILABILITY.some((a) => a.value === availability)) return fail("Please choose availability.");
  if (!PRODUCT_CONDITIONS.some((c) => c.value === condition)) return fail("Please choose a condition.");

  const priceRaw = formData.get("price")?.toString().trim() ?? "";
  const price = Number(priceRaw);
  if (!priceRaw || !Number.isInteger(price) || price < 0 || price > 1_000_000_000) {
    return fail("Enter the price as a whole number in rupees, e.g. 1500.");
  }

  if (!description) return fail("Product description is required.");
  if (description.length > MAX_PRODUCT_DESCRIPTION_CHARS) {
    return fail(`Description is ${description.length} characters — the limit is ${MAX_PRODUCT_DESCRIPTION_CHARS}.`);
  }

  if (!isValidUrl(productLink)) return fail("Product link doesn't look valid — include https://.");
  if (whatsapp && !isValidUrl(whatsapp)) return fail("WhatsApp link doesn't look valid.");
  if (phone && !/^\+?[0-9][0-9\s-]{7,18}$/.test(phone)) return fail("Phone number doesn't look valid.");

  // A listing nobody can respond to is useless, so at least one way to
  // reach the seller is required.
  if (!whatsapp && !phone && !productLink) {
    return fail("Add at least one way for buyers to reach you: WhatsApp, phone, or a product link.");
  }

  return {
    fields: {
      title,
      company_name: companyName,
      price,
      availability,
      condition,
      category,
      description,
      product_link: productLink,
      tags,
      city,
      address,
      contact_whatsapp: whatsapp,
      contact_phone: phone,
    },
  };
}

// Validates and uploads the NEW image files (each <= 1MB, real images).
// `keptCount` is how many existing images the seller is keeping (0 on
// create), so the 1-5 total can be enforced for both create and edit.
async function uploadNewProductImages(supabase, userId, imageFiles, keptCount) {
  const total = keptCount + imageFiles.length;
  if (total === 0) return { error: "Add at least one product image." };
  if (total > MAX_PRODUCT_IMAGES) {
    return { error: `A product can have at most ${MAX_PRODUCT_IMAGES} images (you have ${total}).` };
  }
  for (const file of imageFiles) {
    const issue = await validateProductImage(file);
    if (issue) return { error: issue };
  }

  const urls = [];
  for (const file of imageFiles) {
    const upload = await uploadPublicImage(supabase, file, "product-images", userId);
    if (upload.error) {
      // Don't leave the earlier files of this failed attempt orphaned.
      for (const url of urls) await deletePublicImage(supabase, url);
      return { error: upload.error.message };
    }
    urls.push(upload.url);
  }
  return { urls };
}

// (prevState, formData) => state — the useActionState signature (see
// app/components/ProductPostForm.js). Validation failures RETURN an error so
// the form stays on screen with everything the seller typed; only success
// redirects.
export async function createProduct(prevState, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/account/products/new");

  const parsed = parseProductFields(formData);
  if (parsed.error) return { error: parsed.error };

  const imageFiles = formData.getAll("images").filter((f) => f instanceof File && f.size > 0);
  const uploaded = await uploadNewProductImages(supabase, user.id, imageFiles, 0);
  if (uploaded.error) return { error: uploaded.error };

  const slug = await generateUniqueProductSlug(supabase, parsed.fields.title);

  const { error } = await supabase.from("products").insert({
    ...parsed.fields,
    seller_id: user.id,
    slug,
    image_urls: uploaded.urls,
    status: "published",
    published_at: new Date().toISOString(),
  });

  if (error) {
    for (const url of uploaded.urls) await deletePublicImage(supabase, url);
    return { error: error.message };
  }

  revalidatePath("/products");
  revalidatePath("/account/products");
  redirect(`/products/${slug}?posted=1`);
}

// Edit — bound with the product id: updateProduct.bind(null, id). Lets the
// seller change anything, including availability (In Stock / Out of Stock /
// Pre-Order) and status (Live / Sold) when it sells. The slug is NOT
// regenerated, so existing shared links and search results keep working.
export async function updateProduct(productId, prevState, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("products")
    .select("seller_id, slug, image_urls")
    .eq("id", productId)
    .maybeSingle();
  if (!existing || existing.seller_id !== user.id) redirect("/account/products");

  const parsed = parseProductFields(formData);
  if (parsed.error) return { error: parsed.error };

  const status = formData.get("status")?.toString().trim() ?? "";
  if (!["published", "sold"].includes(status)) return { error: "Please choose whether the product is Live or Sold." };

  // Which existing images the seller kept — checked against what's really
  // stored, so a crafted form can't attach someone else's image URL.
  const oldUrls = existing.image_urls ?? [];
  const keptUrls = (formData.get("existingImages")?.toString() ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter((u) => u && oldUrls.includes(u));

  const imageFiles = formData.getAll("images").filter((f) => f instanceof File && f.size > 0);
  const uploaded = await uploadNewProductImages(supabase, user.id, imageFiles, keptUrls.length);
  if (uploaded.error) return { error: uploaded.error };

  const { error } = await supabase
    .from("products")
    .update({
      ...parsed.fields,
      status,
      image_urls: [...keptUrls, ...uploaded.urls],
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  if (error) {
    for (const url of uploaded.urls) await deletePublicImage(supabase, url);
    return { error: error.message };
  }

  // Only after the row is saved: remove the files the seller took out.
  for (const url of oldUrls.filter((u) => !keptUrls.includes(u))) {
    await deletePublicImage(supabase, url);
  }

  revalidatePath("/products");
  revalidatePath("/account/products");
  revalidatePath(`/products/${existing.slug}`);
  redirect(`/products/${existing.slug}?updated=1`);
}

async function getOwnProduct(supabase, productId, columns) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: product } = await supabase.from("products").select(columns).eq("id", productId).maybeSingle();
  if (!product || product.seller_id !== user.id) redirect("/account/products");
  return product;
}

// Sold <-> live. A sold product drops out of the /products feed but its
// page stays up with a "Sold" badge, so shared links don't 404.
export async function setProductSold(productId, sold) {
  const supabase = await createClient();
  const product = await getOwnProduct(supabase, productId, "seller_id, slug");

  await supabase
    .from("products")
    .update({ status: sold ? "sold" : "published", updated_at: new Date().toISOString() })
    .eq("id", productId);

  revalidatePath("/products");
  revalidatePath("/account/products");
  if (product.slug) revalidatePath(`/products/${product.slug}`);
}

export async function deleteOwnProduct(productId) {
  const supabase = await createClient();
  const product = await getOwnProduct(supabase, productId, "seller_id, image_urls");

  await supabase.from("products").delete().eq("id", productId);
  for (const url of product.image_urls ?? []) {
    await deletePublicImage(supabase, url);
  }

  revalidatePath("/products");
  revalidatePath("/account/products");
  redirect("/account/products");
}
