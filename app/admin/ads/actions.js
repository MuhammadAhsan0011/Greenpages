"use server";

import sharp from "sharp";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { uploadPublicImage, deletePublicImage } from "@/utils/storage";
import { clearAdConfigCache } from "@/lib/adsServer";
import {
  AD_SIZES,
  AD_SIZE_OPTIONS,
  AD_TYPES,
  AD_ROTATIONS,
  AD_DISPLAY_MODES,
  MAX_ADS_PER_SLOT,
  AD_ASPECT_TOLERANCE,
  ALLOWED_AD_IMAGE_TYPES,
  MAX_AD_IMAGE_BYTES,
  isSafeTargetUrl,
  todayInKarachi,
} from "@/lib/ads";
import { requireAdminPage } from "./guard";

const SIZE_KEYS = AD_SIZE_OPTIONS.map((option) => option.value);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function refresh() {
  clearAdConfigCache();
  revalidatePath("/admin/ads", "layout");
}

function isRealDate(value) {
  return DATE_PATTERN.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

// Reads and validates the add/edit form. Returns { error } or { values, file }.
// Everything is checked here, not just in the form: this is the code that
// actually runs when a request is submitted.
async function readAdForm(supabase, formData, existing) {
  const text = (name) => formData.get(name)?.toString().trim() ?? "";

  const name = text("name");
  const advertiser = text("advertiser");
  const targetUrl = text("targetUrl");
  const adType = text("adType");
  const sizeKey = text("sizeKey");
  const slotKey = text("slotKey");
  const startDate = text("startDate") || todayInKarachi();
  const endDate = text("endDate") || null;
  const priority = Number.parseInt(text("priority") || "5", 10);
  const status = text("status") === "inactive" ? "inactive" : "active";
  const openInNewTab = text("openInNewTab") !== "no";

  if (!name || name.length > 120) return { error: "Advertisement name is required (120 characters at most)." };
  if (!advertiser || advertiser.length > 120) return { error: "Advertiser / brand name is required (120 characters at most)." };
  if (!isSafeTargetUrl(targetUrl)) {
    return { error: "Enter the full affiliate URL, starting with https:// (or http://), without a username or password in it." };
  }
  if (!AD_TYPES.some((type) => type.value === adType)) return { error: "Choose an advertisement type." };
  if (!SIZE_KEYS.includes(sizeKey)) return { error: "Choose a banner size." };
  if (!isRealDate(startDate)) return { error: "Start date isn't a valid date." };
  if (endDate && !isRealDate(endDate)) return { error: "Expiry date isn't a valid date." };
  if (endDate && endDate < startDate) return { error: "Expiry date can't be before the start date." };
  if (!Number.isInteger(priority) || priority < 1 || priority > 10) return { error: "Priority must be a whole number from 1 to 10." };

  const { data: slot } = await supabase.from("ad_slots").select("key, label, allowed_sizes").eq("key", slotKey).maybeSingle();
  if (!slot) return { error: "Choose a placement location." };
  if (slot.allowed_sizes?.length > 0 && !slot.allowed_sizes.includes(sizeKey)) {
    return {
      error: `The "${slot.label}" placement doesn't accept that banner size. Pick another size or placement, or change the placement's allowed sizes under Placement Settings.`,
    };
  }

  // ---- image ----
  const file = formData.get("image");
  const hasNewFile = file instanceof File && file.size > 0;
  if (!hasNewFile && !existing) return { error: "Upload a banner image (JPG, PNG or WebP)." };

  let image = null;
  if (hasNewFile) {
    if (!ALLOWED_AD_IMAGE_TYPES.includes(file.type)) {
      return { error: `Banner images must be JPG, PNG or WebP (that file was ${file.type || "an unknown type"}).` };
    }
    if (file.size > MAX_AD_IMAGE_BYTES) {
      return { error: `That image is ${(file.size / (1024 * 1024)).toFixed(1)}MB - banners can be up to 2MB. Compress it and try again.` };
    }
    try {
      const meta = await sharp(Buffer.from(await file.arrayBuffer())).metadata();
      if (!meta.width || !meta.height) throw new Error("no dimensions");
      image = { width: meta.width, height: meta.height };
    } catch {
      return { error: "That file couldn't be read as an image. Try exporting it again as JPG, PNG or WebP." };
    }
  }

  // ---- display dimensions ----
  let width;
  let height;
  if (sizeKey === "custom") {
    width = Number.parseInt(text("customWidth"), 10);
    height = Number.parseInt(text("customHeight"), 10);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 20 || height < 20 || width > 2000 || height > 2000) {
      return { error: "Custom size needs a width and height between 20 and 2000 pixels." };
    }
  } else if (sizeKey === "responsive") {
    const source = image ?? existing;
    width = source.width;
    height = source.height;
    if (width < 100 || width > 2000) return { error: "A responsive banner image should be between 100 and 2000 pixels wide." };
  } else {
    width = AD_SIZES[sizeKey].width;
    height = AD_SIZES[sizeKey].height;
  }

  // The image has to match the size it will be shown at, or it would look
  // stretched/squashed. With no new upload, the ad's previous dimensions stand
  // in for the image's shape.
  const shape = image ?? (existing ? { width: existing.width, height: existing.height } : null);
  if (shape && sizeKey !== "responsive") {
    const wanted = width / height;
    const actual = shape.width / shape.height;
    if (Math.abs(actual - wanted) / wanted > AD_ASPECT_TOLERANCE) {
      return {
        error: image
          ? `That image is ${shape.width}×${shape.height}px, which doesn't match the ${width}×${height} size you chose (it would look stretched). Upload a ${width}×${height} image, or choose a size that fits it.`
          : `Changing to ${width}×${height} needs a new image of that size - upload one.`,
      };
    }
    if (image && image.width < width * 0.9) {
      return { error: `That image is only ${image.width}px wide - it would look blurry at ${width}px. Upload one at least ${width}px wide.` };
    }
  }

  return {
    values: {
      name,
      advertiser,
      target_url: targetUrl,
      ad_type: adType,
      size_key: sizeKey,
      width,
      height,
      slot_key: slotKey,
      start_date: startDate,
      end_date: endDate,
      priority,
      status,
      open_in_new_tab: openInNewTab,
    },
    file: hasNewFile ? file : null,
  };
}

async function imageIsUsedElsewhere(supabase, imageUrl, exceptId) {
  const { count } = await supabase
    .from("ads")
    .select("id", { count: "exact", head: true })
    .eq("image_url", imageUrl)
    .neq("id", exceptId);
  return (count ?? 0) > 0;
}

export async function createAd(_previousState, formData) {
  const { supabase, user } = await requireAdminPage();

  const parsed = await readAdForm(supabase, formData, null);
  if (parsed.error) return { error: parsed.error };

  const upload = await uploadPublicImage(supabase, parsed.file, "ads", user.id);
  if (upload.error) return { error: upload.error.message };

  const { error } = await supabase.from("ads").insert({ ...parsed.values, image_url: upload.url });
  if (error) {
    await deletePublicImage(supabase, upload.url);
    return { error: error.message };
  }

  refresh();
  redirect("/admin/ads?saved=created");
}

export async function updateAd(id, _previousState, formData) {
  const { supabase, user } = await requireAdminPage();

  const { data: existing } = await supabase.from("ads").select("*").eq("id", id).maybeSingle();
  if (!existing) redirect("/admin/ads");

  const parsed = await readAdForm(supabase, formData, existing);
  if (parsed.error) return { error: parsed.error };

  let imageUrl = existing.image_url;
  let replacedUrl = null;
  if (parsed.file) {
    const upload = await uploadPublicImage(supabase, parsed.file, "ads", user.id);
    if (upload.error) return { error: upload.error.message };
    imageUrl = upload.url;
    replacedUrl = existing.image_url;
  }

  const { error } = await supabase
    .from("ads")
    .update({ ...parsed.values, image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    if (parsed.file) await deletePublicImage(supabase, imageUrl);
    return { error: error.message };
  }

  // Only now that the row points at the new file is the old one safe to drop -
  // and only if no duplicate of this ad still uses it.
  if (replacedUrl && !(await imageIsUsedElsewhere(supabase, replacedUrl, id))) {
    await deletePublicImage(supabase, replacedUrl);
  }

  refresh();
  redirect("/admin/ads?saved=updated");
}

export async function deleteAd(id) {
  const { supabase } = await requireAdminPage();

  const { data: ad } = await supabase.from("ads").select("image_url").eq("id", id).maybeSingle();
  if (!ad) return;

  const { error } = await supabase.from("ads").delete().eq("id", id);
  if (error) return;

  if (!(await imageIsUsedElsewhere(supabase, ad.image_url, id))) {
    await deletePublicImage(supabase, ad.image_url);
  }
  refresh();
}

// Copies an ad (same banner file, new row, stats start at zero). The copy is
// created Inactive so it can be edited before it goes live.
export async function duplicateAd(id) {
  const { supabase } = await requireAdminPage();

  const { data: ad } = await supabase.from("ads").select("*").eq("id", id).maybeSingle();
  if (!ad) return;

  const { id: _id, created_at: _created, updated_at: _updated, ...copy } = ad;
  await supabase.from("ads").insert({ ...copy, name: `${ad.name} (copy)`.slice(0, 120), status: "inactive" });
  refresh();
}

export async function setAdStatus(id, status) {
  const { supabase } = await requireAdminPage();
  if (status !== "active" && status !== "inactive") return;

  await supabase.from("ads").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  refresh();
}

export async function saveSlot(formData) {
  const { supabase } = await requireAdminPage();

  const key = formData.get("key")?.toString();
  const maxAds = Number.parseInt(formData.get("maxAds")?.toString() ?? "", 10);
  const rotation = formData.get("rotation")?.toString();
  if (!key || !Number.isInteger(maxAds) || maxAds < 1 || maxAds > MAX_ADS_PER_SLOT) return;
  if (!AD_ROTATIONS.some((option) => option.value === rotation)) return;
  const displayMode = formData.get("displayMode")?.toString();
  if (!AD_DISPLAY_MODES.some((option) => option.value === displayMode)) return;

  const allowedSizes = formData.getAll("allowedSizes").map(String).filter((size) => SIZE_KEYS.includes(size));

  await supabase
    .from("ad_slots")
    .update({
      enabled: formData.get("enabled") === "yes",
      allowed_sizes: allowedSizes,
      show_desktop: formData.get("showDesktop") === "yes",
      show_tablet: formData.get("showTablet") === "yes",
      show_mobile: formData.get("showMobile") === "yes",
      max_ads: maxAds,
      rotation,
      display_mode: displayMode,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);

  refresh();
  redirect(`/admin/ads/slots?saved=${encodeURIComponent(key)}`);
}
