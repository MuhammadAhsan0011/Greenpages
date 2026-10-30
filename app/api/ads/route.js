import { NextResponse } from "next/server";
import { getAdConfig } from "@/lib/adsServer";

// Public, cache-friendly description of which ads each placement can show
// right now. Selection/rotation happens in the browser (see AdSlot.js), which
// keeps pages static and means a new ad shows up within about a minute
// without a redeploy.
export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getAdConfig();
  return NextResponse.json(config, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
