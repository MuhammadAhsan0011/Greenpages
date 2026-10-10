import { NextResponse } from "next/server";
import { updateSession } from "./utils/supabase/middleware";
import { SITE_HOST } from "@/lib/site";

const CANONICAL_HOST = SITE_HOST;
const APEX_HOST = SITE_HOST.replace(/^www\./, "");

export async function middleware(request) {
  // Off Vercel there's no platform-level apex -> www redirect, so the bare
  // domain would otherwise serve a duplicate copy of every page.
  const requestHost = (request.headers.get("host") || "").split(":")[0];
  if (requestHost === APEX_HOST) {
    const url = new URL(request.url);
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  // Permanently redirect the old *.vercel.app deployment URL to the custom
  // domain — required for Google Search Console's Change of Address tool
  // to validate the migration, and it consolidates SEO signals onto one
  // canonical host instead of splitting them across two live domains.
  const host = request.headers.get("host") || "";
  if (host.endsWith(".vercel.app")) {
    const url = new URL(request.url);
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
