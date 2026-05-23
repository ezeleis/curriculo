#!/usr/bin/env node
/**
 * Issue a time-limited invite link for the gated résumé site.
 *
 * Easiest (one-time setup):
 *   Copy .env.example → .env.local, fill SITE_BASE_URL + ACCESS_TOKEN_SECRET
 *   node scripts/issue-invite.mjs --label "Acme recruiter"
 *
 * One-line paste (URL and secret together):
 *   node scripts/issue-invite.mjs --paste "https://your-app.vercel.app|YOUR_SECRET" --label "Acme"
 *
 * PowerShell wrapper:
 *   .\scripts\invite.ps1 -Label "Acme recruiter"
 */

import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createInviteToken } from "../lib/token.mjs";

var root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filename, overrideExisting) {
  var path = join(root, filename);
  if (!existsSync(path)) return false;
  var raw = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
  raw.split(/\r?\n/).forEach(function (line) {
    var trimmed = line.trim();
    if (!trimmed || trimmed.charAt(0) === "#") return;
    var eq = trimmed.indexOf("=");
    if (eq === -1) return;
    var key = trimmed.slice(0, eq).trim();
    var val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (overrideExisting || !process.env[key]) process.env[key] = val;
  });
  return true;
}

var hasEnvLocal = loadEnvFile(".env.local", true);
loadEnvFile(".env", false);

function readArg(name, fallback) {
  var idx = process.argv.indexOf(name);
  if (idx === -1 || !process.argv[idx + 1]) return fallback;
  return process.argv[idx + 1];
}

var paste = readArg("--paste", "");
if (paste) {
  var pipe = paste.indexOf("|");
  if (pipe === -1) {
    console.error('--paste must be "https://your-site.vercel.app|YOUR_SECRET"');
    process.exit(1);
  }
  process.env.SITE_BASE_URL = paste.slice(0, pipe).trim();
  process.env.ACCESS_TOKEN_SECRET = paste.slice(pipe + 1).trim();
}

var secretArg = readArg("--secret", "");
if (secretArg) {
  process.env.ACCESS_TOKEN_SECRET = secretArg.trim();
}

var secret = process.env.ACCESS_TOKEN_SECRET;
if (!secret || secret.length < 32) {
  console.error("Missing ACCESS_TOKEN_SECRET (min 32 chars).");
  console.error("");
  console.error("Diagnostics:");
  console.error("  .env.local in repo root : " + (hasEnvLocal ? "found" : "NOT FOUND"));
  console.error("  ACCESS_TOKEN_SECRET     : " +
      (secret ? "too short (" + secret.length + " chars)" : "empty or not set"));
  if (process.env.ACCESS_TOKEN_SECRET && secret && secret.length < 32) {
    console.error("  Hint                    : old PowerShell $env:ACCESS_TOKEN_SECRET may override .env.local");
    console.error("                          run: Remove-Item Env:ACCESS_TOKEN_SECRET -ErrorAction SilentlyContinue");
  }
  console.error("  Repo root               : " + root);
  console.error("");
  console.error("Fix — pick one:");
  console.error("  1. Create .env.local next to index.html with:");
  console.error("       SITE_BASE_URL=https://your-app.vercel.app");
  console.error("       ACCESS_TOKEN_SECRET=paste-from-vercel");
  console.error('  2. One line: --paste "https://your-app.vercel.app|YOUR_SECRET"');
  console.error("  3. Flags:   --site URL --secret YOUR_SECRET");
  process.exit(1);
}

var site = readArg("--site", process.env.SITE_BASE_URL || "");
if (!site || site.includes("YOUR-APP")) {
  console.error("Missing site URL. Set SITE_BASE_URL in .env.local or use --paste / --site.");
  process.exit(1);
}

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
