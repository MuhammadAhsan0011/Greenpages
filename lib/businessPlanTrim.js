import { getPlanCapabilities, getPhotoLimit } from "../app/data/plans.js";

const splitList = (value) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

// Image URLs embedded in a rich-text (About) body — those files live in the
// same storage bucket and need cleaning up along with the text.
export function imageUrlsInHtml(html) {
  return [...(html ?? "").matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((match) => match[1]);
}

// What an admin has to remove from a listing so it only carries what `plan`
// allows — used when an owner asked for Verified/Premium, filled in its extra
// features, and then didn't pay: the listing goes live on its real plan and
// the unpaid data is deleted (rows AND storage files) instead of piling up.
// Returns the column updates to apply plus the storage file URLs to delete
// once that update has actually saved. Logo is a Basic feature — never touched.
export function trimBusinessToPlan(business, plan) {
  const capabilities = getPlanCapabilities(plan);
  const photos = splitList(business.photos);
  const keptPhotos = photos.slice(0, getPhotoLimit(plan));

  const update = {};
  const removedFiles = photos.slice(keptPhotos.length);

  if (keptPhotos.length !== photos.length) {
    update.photos = keptPhotos.length > 0 ? keptPhotos.join(", ") : null;
  }
  if (!capabilities.coverImage && business.cover_image_url) {
    update.cover_image_url = null;
    removedFiles.push(business.cover_image_url);
  }
  if (!capabilities.socialLinks) {
    for (const column of ["facebook_url", "instagram_url", "linkedin_url", "whatsapp_url"]) {
      if (business[column]) update[column] = null;
    }
  }
  if (!capabilities.aboutEditor && business.about_html) {
    update.about_html = null;
    removedFiles.push(...imageUrlsInHtml(business.about_html));
  }

  return { update, removedFiles };
}
