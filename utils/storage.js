function extensionFor(file) {
  const fromName = file.name?.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type?.split("/").pop() ?? "jpg";
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
