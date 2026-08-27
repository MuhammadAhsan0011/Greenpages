function extensionFor(file) {
  const fromName = file.name?.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type?.split("/").pop() ?? "jpg";
}

const PUBLIC_URL_MARKER = "/storage/v1/object/public/uploads/";

// Deletes a file previously uploaded via uploadPublicImage, given its public
// URL, so replacing/removing an image (logo, cover, inline) doesn't leave the
// old file behind in the "uploads" bucket forever. Safe to call with a URL
// that doesn't belong to this bucket — it's just a no-op.
export async function deletePublicImage(supabase, publicUrl) {
  if (!publicUrl) return;
  const markerIndex = publicUrl.indexOf(PUBLIC_URL_MARKER);
  if (markerIndex === -1) return;

  const path = decodeURIComponent(publicUrl.slice(markerIndex + PUBLIC_URL_MARKER.length));
  await supabase.storage.from("uploads").remove([path]);
}

// Uploads an image File to the shared public "uploads" Storage bucket
// under the given folder, and returns its public URL. `supabase` must be
// the cookie-authenticated server client (see utils/supabase/server.js) so
// the upload is attributed to the signed-in user, matching the storage
// RLS policies in supabase/schema.sql.
export async function uploadPublicImage(supabase, file, folder, userId) {
  const path = `${folder}/${userId}-${Date.now()}.${extensionFor(file)}`;
  const { error } = await supabase.storage
    .from("uploads")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) {
    return { error };
  }

  const { data } = supabase.storage.from("uploads").getPublicUrl(path);
  return { url: data.publicUrl };
}
