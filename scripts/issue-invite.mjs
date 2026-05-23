#!/usr/bin/env node
/**
 * Issue a time-limited invite link for the gated résumé site.
 *
 * Usage:
 *   ACCESS_TOKEN_SECRET=... node scripts/issue-invite.mjs --site https://your-app.vercel.app --days 7 --label "Acme recruiter"
 *
 * Never commit ACCESS_TOKEN_SECRET. Use the same value as Vercel env.
 */

import { createInviteToken } from "../lib/token.mjs";

function readArg(name, fallback) {
  var idx = process.argv.indexOf(name);
  if (idx === -1 || !process.argv[idx + 1]) return fallback;
  return process.argv[idx + 1];
}

var secret = process.env.ACCESS_TOKEN_SECRET;
if (!secret || secret.length < 32) {
  console.error("Set ACCESS_TOKEN_SECRET (min 32 chars) — same value as Vercel.");
  process.exit(1);
}

var site = readArg("--site", process.env.SITE_BASE_URL || "https://YOUR-APP.vercel.app");
var days = Number(readArg("--days", "7"));
var label = readArg("--label", "share");

if (!Number.isFinite(days) || days < 1 || days > 90) {
  console.error("--days must be between 1 and 90");
  process.exit(1);
}

var result = await createInviteToken(secret, { days: days, label: label });
var url = site.replace(/\/$/, "") + "/unlock.html?invite=" + encodeURIComponent(result.token);

console.log("");
console.log("Invite label : " + label);
console.log("Valid for    : " + days + " day(s)");
console.log("Expires (UTC): " + new Date(result.payload.exp * 1000).toISOString());
console.log("");
console.log("Share link:");
console.log(url);
console.log("");
console.log("Raw token (manual paste on unlock page):");
console.log(result.token);
console.log("");
