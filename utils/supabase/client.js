import { createBrowserClient } from "@supabase/ssr";

// Supabase client for use inside Client Components ("use client").
// Reads the public URL/key — safe to expose in the browser bundle.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
