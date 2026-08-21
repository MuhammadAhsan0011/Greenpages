import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// A plain Supabase client for public, no-auth-required reads (blog listing,
// category listings, the business directory, the sitemap). Unlike
// utils/supabase/server.js, this never touches cookies(), so pages using it
// stay eligible for static generation/ISR instead of being forced into
// full per-request server rendering.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
