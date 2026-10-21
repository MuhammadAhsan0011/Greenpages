// The one-time author profile (bio / photo / phone) lives in its own
// `author_profiles` table keyed by user, so writing an article never requires
// a business listing. Authors who set theirs up before that table existed
// still have the values on their business row — fall back to those so they
// aren't asked to fill it in twice.
export async function getAuthorProfile(supabase, userId, business = null) {
  const { data } = await supabase
    .from("author_profiles")
    .select("bio, photo_url, phone")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    bio: data?.bio ?? business?.author_bio ?? null,
    photo_url: data?.photo_url ?? business?.author_photo_url ?? null,
    phone: data?.phone ?? business?.author_phone ?? null,
  };
}
