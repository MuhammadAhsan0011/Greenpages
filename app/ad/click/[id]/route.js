import { NextResponse } from "next/server";
import { createPublicClient } from "@/utils/supabase/public";
import { isAdEligible, isLikelyBot, isSafeTargetUrl, isUuid } from "@/lib/ads";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

// Every banner links here, never straight to the advertiser, so clicks can be
// counted before the visitor is forwarded. The destination comes ONLY from the
// saved ad (never from the query string), so this can't be turned into an open
// redirect, and it is sent exactly as saved - affiliate/tracking parameters
// are not parsed, re-ordered or stripped.
export async function GET(request, { params }) {
  const { id } = await params;
  // Not request.url: behind the cPanel proxy its origin is the internal localhost.
  const home = new URL("/", getSiteUrl(request.headers));

  if (!isUuid(id)) return NextResponse.redirect(home, 302);

  const supabase = createPublicClient();
  // RLS only lets visitors read ACTIVE ads, so an inactive ad can't be reached.
  const { data: ad } = await supabase
    .from("ads")
    .select("id, target_url, status, start_date, end_date")
    .eq("id", id)
    .maybeSingle();

  if (!ad || !isAdEligible(ad) || !isSafeTargetUrl(ad.target_url)) {
    return NextResponse.redirect(home, 302);
  }

  const slot = request.nextUrl.searchParams.get("s")?.slice(0, 40) ?? "";
  const cookieName = `adc_${id}`;
  const alreadyCounted = request.cookies.has(cookieName);
  const countable = !alreadyCounted && !isLikelyBot(request.headers.get("user-agent")) && slot;

  if (countable) {
    await supabase.rpc("record_ad_event", { p_ad: id, p_slot: slot, p_kind: "click" });
  }

  // A raw Response, not NextResponse.redirect(): the latter re-serialises the
  // URL, and the saved string must reach the advertiser byte for byte.
  const headers = new Headers({
    Location: ad.target_url,
    "Cache-Control": "no-store",
    "Referrer-Policy": "origin",
  });
  if (countable) {
    // Ignore repeat clicks (double-clicks, refresh) for 10 seconds.
    headers.append("Set-Cookie", `${cookieName}=1; Max-Age=10; Path=/ad/click; HttpOnly; SameSite=Lax`);
  }
  return new Response(null, { status: 302, headers });
}
