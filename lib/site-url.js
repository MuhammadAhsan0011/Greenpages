import { SITE_URL } from "@/lib/site";

// Base URL for links the server builds for the user's browser: auth
// redirects, email confirmation / password-reset links. In production it is
// ALWAYS the public host and never derived from the request, because behind
// the cPanel/Passenger proxy the Node process sees its own internal address
// (http://localhost:3000), which used to leak into post-login redirects.
//
// Order: NEXT_PUBLIC_SITE_URL -> SITE_URL (lib/site.js) in production;
// in development the request's own origin -> http://localhost:3000.
function stripTrailingSlash(url) {
  return url.replace(/\/+$/, "");
}

// `headers` is a Headers object (request.headers, or the result of
// next/headers' headers()). Only consulted in development.
export function getSiteUrl(headers) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return stripTrailingSlash(fromEnv);

  if (process.env.NODE_ENV === "production") return stripTrailingSlash(SITE_URL);

  const host = headers?.get("x-forwarded-host") || headers?.get("host");
  if (host) {
    const proto = headers.get("x-forwarded-proto") || "http";
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

// Only same-site relative paths are allowed as a post-login destination;
// "//evil.com" and "/\evil.com" are protocol-relative tricks browsers treat
// as another host.
export function safeNextPath(next, fallback = "/account") {
  if (typeof next !== "string" || !next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
