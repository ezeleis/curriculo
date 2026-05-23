import {
  gateEnabled,
  verifyInviteToken,
  createSessionToken,
  SESSION_COOKIE
} from "../lib/token.mjs";

export const config = {
  runtime: "edge"
};

function safeRedirectPath(value) {
  if (!value || typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!gateEnabled(process.env)) {
    return Response.json({ ok: true, redirect: "/" });
  }

  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    return Response.json({ ok: false, error: "misconfigured" }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const token = (body.token || "").trim();
  if (!token) {
    return Response.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  const invite = await verifyInviteToken(token, secret);
  if (!invite.ok) {
    return Response.json({ ok: false, error: invite.reason || "denied" }, { status: 401 });
  }

  const sessionHours = Number(process.env.SESSION_HOURS || 24);
  const sessionToken = await createSessionToken(secret, invite.payload, sessionHours);
  const redirect = safeRedirectPath(body.next);

  const cookieParts = [
    SESSION_COOKIE + "=" + encodeURIComponent(sessionToken),
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=" + String(sessionHours * 3600)
  ];

  if (new URL(request.url).protocol === "https:") {
    cookieParts.push("Secure");
  }

  return new Response(JSON.stringify({ ok: true, redirect }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Set-Cookie": cookieParts.join("; ")
    }
  });
}
