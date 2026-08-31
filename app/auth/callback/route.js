import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Route Handler Google OAuth redirects back to after the user approves
// sign-in. Exchanges the one-time code for a real session (stored in
// cookies), then sends them on to wherever they were headed.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next")?.startsWith("/") ? searchParams.get("next") : "/account";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Could not sign in with Google. Please try again.")}`
  );
}
