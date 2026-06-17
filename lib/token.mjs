/**
 * HMAC-SHA256 signed tokens (Web Crypto — Edge + Node 18+).
 * Invite tokens: share via link. Session tokens: HttpOnly cookie after unlock.
 */

const TOKEN_PREFIX = "v1";

function encodeBytes(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeJson(obj) {
  return encodeBytes(new TextEncoder().encode(JSON.stringify(obj)));
}

function decodeJson(value) {
  return JSON.parse(new TextDecoder().decode(decodeBytes(value)));
}

async function importKey(secret) {
  if (!secret || secret.length < 32) {
    throw new Error("ACCESS_TOKEN_SECRET must be at least 32 characters");
  }
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signPayload(payload, secret) {
  const key = await importKey(secret);
  const body = encodeJson(payload);
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return TOKEN_PREFIX + "." + body + "." + encodeBytes(new Uint8Array(sigBytes));
}

async function verifyToken(token, secret, expectedType) {
  if (!token || typeof token !== "string") return { ok: false, reason: "missing" };

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return { ok: false, reason: "format" };

  const body = parts[1];
  const sig = parts[2];

  try {
    const key = await importKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBytes(sig),
      new TextEncoder().encode(body)
    );
    if (!valid) return { ok: false, reason: "signature" };

    const payload = decodeJson(body);
    if (expectedType && payload.typ !== expectedType) return { ok: false, reason: "type" };
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
      return { ok: false, reason: "expired" };
    }

    return { ok: true, payload };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export async function createInviteToken(secret, options) {
  const days = options.days || 7;
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    typ: "invite",
    exp: now + days * 86400,
    iat: now,
    jti: crypto.randomUUID(),
    label: options.label || "share"
  };
  if (options.profiles && options.profiles.length > 0) {
    payload.profiles = options.profiles;
  }
  const token = await signPayload(payload, secret);
  return { token, payload };
}

export async function createSessionToken(secret, invitePayload, sessionHours) {
  const hours = sessionHours || 24;
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    typ: "session",
    exp: now + hours * 3600,
    iat: now,
    jti: crypto.randomUUID(),
    via: invitePayload.jti,
    label: invitePayload.label || "share"
  };
  if (invitePayload.profiles && invitePayload.profiles.length > 0) {
    payload.profiles = invitePayload.profiles;
  }
  return signPayload(payload, secret);
}

export async function verifyInviteToken(token, secret) {
  return verifyToken(token, secret, "invite");
}

export async function verifySessionToken(token, secret) {
  return verifyToken(token, secret, "session");
}

export const SESSION_COOKIE = "fl_session";

export function parseCookie(header, name) {
  if (!header) return null;
  const match = header.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function gateEnabled(env) {
  return String(env.ACCESS_GATE_ENABLED || "").toLowerCase() === "true";
}
