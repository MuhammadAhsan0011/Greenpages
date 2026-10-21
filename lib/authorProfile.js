// The one-time author profile (bio / photo / phone) and the annual Publisher
// Plan live in the `author_profiles` table keyed by user, so writing an article
// or buying a Publisher Plan never requires a business listing. Authors who
// set theirs up before that table existed still have the values on their
// business row — fall back to those so nothing is lost or asked for twice.
export async function getAuthorProfile(supabase, userId, business = null) {
  const { data } = await supabase
    .from("author_profiles")
    .select("bio, photo_url, phone, publisher_plan, requested_publisher_plan")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    bio: data?.bio ?? business?.author_bio ?? null,
    photo_url: data?.photo_url ?? business?.author_photo_url ?? null,
    phone: data?.phone ?? business?.author_phone ?? null,
    // A row's publisher_plan is authoritative (it defaults to 'basic'); the
    // business value is only a fallback for users with no row yet.
    publisher_plan: data ? data.publisher_plan : (business?.publisher_plan ?? "basic"),
    requested_publisher_plan: data ? data.requested_publisher_plan : (business?.requested_publisher_plan ?? null),
  };
}
