import { NextResponse } from "next/server";
import { createPublicClient } from "@/utils/supabase/public";
import { isLikelyBot, isUuid } from "@/lib/ads";

export const dynamic = "force-dynamic";

// Per-IP ceiling so a script can't pump the counters: 60 impressions/minute.
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 60;
const hits = globalThis.__adImpressionHits ?? (globalThis.__adImpressionHits = new Map());

function rateLimited(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

// Called by the browser once a banner has actually been on screen (see
// AdSlot.js) - not on page load. record_ad_event() ignores unknown ads/slots.
export async function POST(request) {
  const userAgent = request.headers.get("user-agent");
  if (isLikelyBot(userAgent)) return new NextResponse(null, { status: 204 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return new NextResponse(null, { status: 429 });

  let body;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const { id, slot } = body ?? {};
  if (!isUuid(id) || typeof slot !== "string" || slot.length === 0 || slot.length > 40) {
    return new NextResponse(null, { status: 400 });
  }

  const supabase = createPublicClient();
  await supabase.rpc("record_ad_event", { p_ad: id, p_slot: slot, p_kind: "impression" });
  return new NextResponse(null, { status: 204 });
}
