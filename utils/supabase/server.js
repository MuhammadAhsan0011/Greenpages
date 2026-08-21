import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client for use in Server Components, Server Actions, and Route
// Handlers. Reads/writes the user's auth session via cookies so requests
// are authenticated on the server without shipping a session token to
// client-side JavaScript.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component (not a Server
            // Action/Route Handler), where cookies can't be written.
            // Safe to ignore as long as middleware.js is refreshing the
            // session on every request.
          }
        },
      },
    }
  );
}
