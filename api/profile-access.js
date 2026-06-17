import {
  gateEnabled,
  parseCookie,
  verifySessionToken,
  SESSION_COOKIE
} from "../lib/token.mjs";

export const config = {
  runtime: "edge"
};

export default async function handler(request) {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!gateEnabled(process.env)) {
    return Response.json({ ok: true, profiles: null });
  }

  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "misconfigured" }, { status: 503 });
  }

  const session = parseCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (!session) {
    return Response.json({ ok: false, error: "missing_session" }, { status: 401 });
  }

  const result = await verifySessionToken(session, secret);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.reason || "denied" }, { status: 401 });
  }

  // If profiles are specified in the token, return them; otherwise all are allowed
  const allowedProfiles = result.payload.profiles || null;
  return Response.json({ ok: true, profiles: allowedProfiles });
}
