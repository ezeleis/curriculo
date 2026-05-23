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

function loadEnvFile(filename) {
  var path = join(root, filename);
  if (!existsSync(path)) return;
  readFileSync(path, "utf8")
    .split(/\r?\n/)
    .forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed || trimmed.charAt(0) === "#") return;
      var eq = trimmed.indexOf("=");
      if (eq === -1) return;
      var key = trimmed.slice(0, eq).trim();
      var val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    });
}

loadEnvFile(".env.local");
loadEnvFile(".env");

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

var secret = process.env.ACCESS_TOKEN_SECRET;
if (!secret || secret.length < 32) {
  console.error("Missing ACCESS_TOKEN_SECRET (min 32 chars).");
  console.error("");
  console.error("Option A — one-time: copy .env.example to .env.local and fill values.");
  console.error('Option B — one line: --paste "https://your-app.vercel.app|YOUR_SECRET"');
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
