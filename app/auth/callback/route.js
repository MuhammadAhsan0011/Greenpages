import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSiteUrl, safeNextPath } from "@/lib/site-url";

// Route Handler Google OAuth and email-confirmation links redirect back to.
// Exchanges the one-time code for a real session (stored in cookies), then
// sends them on to wherever they were headed.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  // NOT `new URL(request.url).origin` — behind the cPanel proxy that is the
  // internal http://localhost:3000, not the address the user is on.
  const siteUrl = getSiteUrl(request.headers);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  return NextResponse.redirect(
    `${siteUrl}/login?error=${encodeURIComponent("Could not sign in. Please try again.")}`
  );
}
