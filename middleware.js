import { gateEnabled, parseCookie, verifySessionToken, SESSION_COOKIE } from "./lib/token.mjs";

const PUBLIC_PATHS = new Set(["/unlock.html", "/api/unlock", "/favicon.ico"]);

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/.well-known/")) return true;
  return false;
}

export default async function middleware(request) {
  if (!gateEnabled(process.env)) {
    return;
  }

  const url = new URL(request.url);
  if (isPublicPath(url.pathname)) {
    return;
  }

  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    return new Response("Access gate misconfigured: missing ACCESS_TOKEN_SECRET", { status: 503 });
  }

  const session = parseCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (session) {
    const result = await verifySessionToken(session, secret);
    if (result.ok) {
      return;
    }
  }

  const next = encodeURIComponent(url.pathname + url.search);
  return Response.redirect(new URL("/unlock.html?next=" + next, request.url), 307);
}

export const config = {
  matcher: ["/((?!_next/|_vercel/).*)"]
};
