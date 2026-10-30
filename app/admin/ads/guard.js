import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// Same gate as the rest of /admin: the single ADMIN_EMAIL account. Returns the
// cookie-authenticated client so every query below runs as the admin (and is
// therefore also subject to the admin-only RLS policies in ads-migration.sql).
export async function requireAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  return { supabase, user };
}
