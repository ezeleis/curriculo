#!/usr/bin/env node
/**
 * Issue a time-limited invite link for the gated résumé site.
 *
 * Usage:
 *   ACCESS_TOKEN_SECRET=... node scripts/issue-invite.mjs --site https://your-app.vercel.app --days 7 --label "Acme recruiter"
 *   ACCESS_TOKEN_SECRET=... node scripts/issue-invite.mjs --site https://your-app.vercel.app --days 7 --label "SDR Portuguese" --profiles sdr pt-BR
 *
 * Never commit ACCESS_TOKEN_SECRET. Use the same value as Vercel env.
 * Available profiles: sdr, developer, corretor
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createInviteToken } from "../lib/token.mjs";

// Load .env.local if it exists
function loadEnvLocal() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.dirname(__dirname);
    const envPath = path.join(projectRoot, ".env.local");
    const content = fs.readFileSync(envPath, "utf-8");
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").replace(/^["']|["']$/g, "").trim();
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (e) {
    // .env.local not found, that's fine
  }
}

loadEnvLocal();

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

// Parse --profiles (can be multiple values: --profiles sdr pt-BR developer en)
var profilesIdx = process.argv.indexOf("--profiles");
var profiles = [];
if (profilesIdx !== -1) {
  for (var i = profilesIdx + 1; i < process.argv.length && !process.argv[i].startsWith("--"); i++) {
    profiles.push(process.argv[i]);
  }
}

if (!Number.isFinite(days) || days < 1 || days > 90) {
  console.error("--days must be between 1 and 90");
  process.exit(1);
}

var result = await createInviteToken(secret, { days: days, label: label, profiles: profiles });
var url = site.replace(/\/$/, "") + "/unlock.html?invite=" + encodeURIComponent(result.token);

console.log("");
console.log("Invite label : " + label);
console.log("Valid for    : " + days + " day(s)");
console.log("Expires (UTC): " + new Date(result.payload.exp * 1000).toISOString());
if (profiles.length > 0) {
  console.log("Profiles     : " + profiles.join(", "));
}
console.log("");
console.log("Share link:");
console.log(url);
console.log("");
console.log("Raw token (manual paste on unlock page):");
console.log(result.token);
console.log("");
