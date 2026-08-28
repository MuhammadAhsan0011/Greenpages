import { NextResponse } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

const CANONICAL_HOST = "www.greenpagespk.com";

export async function middleware(request) {
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
