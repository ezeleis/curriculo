# Profile Tokens — Developer Guide

This document explains the technical implementation of profile-restricted tokens for developers who need to extend, debug, or understand the system.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Token Creation (CLI Script)                                     │
├─────────────────────────────────────────────────────────────────┤
│ scripts/issue-invite.mjs                                        │
│  → Parses --profiles argument                                   │
│  → Calls createInviteToken(secret, { profiles: [...] })        │
│  → Generates HMAC-SHA256 signed token                           │
│  → Outputs shareable URL                                        │
└─────────────────────────────────────────────────────────────────┘
                             ↓
                        Share URL
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ Token Exchange (API - unlock.html → /api/unlock)               │
├─────────────────────────────────────────────────────────────────┤
│ api/unlock.js (Vercel Edge Function)                            │
│  → POST { token, next }                                         │
│  → verifyInviteToken(token, secret)                            │
│  → createSessionToken(invitePayload)                           │
│  → Set-Cookie: fl_session (HttpOnly, 24h)                      │
│  → Redirect to next URL                                         │
└─────────────────────────────────────────────────────────────────┘
                             ↓
                      Session Created
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ Profile Enforcement (Frontend)                                  │
├─────────────────────────────────────────────────────────────────┤
│ js/site.js                                                      │
│  → On page load: fetch /api/profile-access                     │
│  → Returns: { ok: true, profiles: ["sdr", "pt-BR"] }          │
│  → Filter PROFILES and LANGS arrays                            │
│  → Render dropdowns with only allowed options                  │
│  → Auto-switch if user tries invalid profile                   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Token Library (`lib/token.mjs`)

Handles cryptographic signing and verification.

**Key Functions:**

```javascript
// Create a time-limited invite token
createInviteToken(secret, { 
  days: 7,                      // Expiration time
  label: "Recruiter Name",      // Human-readable label
  profiles: ["sdr", "pt-BR"]    // Optional: allowed profiles
})
// Returns: { token: "v1...", payload: {...} }

// Create a session token from verified invite
createSessionToken(secret, invitePayload, sessionHours)
// Returns: signed token string

// Verify tokens
verifyInviteToken(token, secret)
verifySessionToken(token, secret)
// Returns: { ok: true, payload: {...} } or { ok: false, reason: "..." }
```

**Token Format:**

```
v1.{base64url(payload)}.{base64url(signature)}

Payload (JSON):
{
  "typ": "invite",
  "exp": 1782309773,              // Unix timestamp (seconds)
  "iat": 1781704973,              // Issued-at time
  "jti": "d3c0be88-...",          // JWT ID
  "label": "SDR Sales",
  "profiles": ["sdr", "pt-BR"]    // Optional
}
```

**Signature Algorithm:**
- HMAC-SHA256 over the payload
- Key = ACCESS_TOKEN_SECRET (min 32 chars)
- Verified server-side on token exchange

### 2. Script (`scripts/issue-invite.mjs`)

CLI tool to generate tokens.

**Argument Parsing:**

```javascript
readArg(name, fallback)
// Gets value after --name flag
// Example: --days 7 → readArg("--days") returns "7"

// Special handling for --profiles (multiple values):
var profilesIdx = process.argv.indexOf("--profiles");
var profiles = [];
if (profilesIdx !== -1) {
  for (var i = profilesIdx + 1; i < process.argv.length; i++) {
    if (process.argv[i].startsWith("--")) break;
    profiles.push(process.argv[i]);  // Collect all non-flag args
  }
}
```

**Environment Variables:**
- `ACCESS_TOKEN_SECRET` — Required, checked for min 32 chars
- `SITE_BASE_URL` — Optional, used as default URL

**Output Format:**
```
Invite label : SDR Sales Portuguese
Valid for    : 7 day(s)
Expires (UTC): 2026-06-24T14:02:53.000Z
Profiles     : sdr, pt-BR          ← Only shown if restricted

Share link:
https://example.com/unlock.html?invite=v1...

Raw token (manual paste on unlock page):
v1...
```

### 3. Unlock API (`api/unlock.js`)

Vercel Edge Function that exchanges invite tokens for sessions.

**Request:**
```json
POST /api/unlock
Content-Type: application/json

{
  "token": "v1.eyJ0eXAi...",
  "next": "/developer.html"
}
```

**Response:**
```json
{
  "ok": true,
  "redirect": "/developer.html"
}
```

**Headers:**
```
Set-Cookie: fl_session=v1...; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400
```

**Flow:**
1. Parse request JSON
2. Call `verifyInviteToken(token, secret)`
3. If valid:
   - Create session token via `createSessionToken(payload)`
   - Set HttpOnly cookie (can't be read by JavaScript)
   - Return redirect path
4. If invalid:
   - Return 401 with error reason

**Error Reasons:**
- `missing` — No token provided
- `format` — Invalid token format (missing dots, wrong prefix)
- `signature` — Signature verification failed
- `type` — Token type not "invite"
- `expired` — Token expiration time passed
- `invalid` — JSON decode or other error

### 4. Profile Access API (`api/profile-access.js`)

Vercel Edge Function that returns allowed profiles for current session.

**Request:**
```
GET /api/profile-access
Cookie: fl_session=v1...
```

**Response (restricted):**
```json
{
  "ok": true,
  "profiles": ["sdr", "pt-BR"]
}
```

**Response (unrestricted):**
```json
{
  "ok": true,
  "profiles": null
}
```

**Implementation:**
```javascript
1. Parse fl_session cookie
2. Call verifySessionToken(session, secret)
3. If valid:
   - Return payload.profiles (array or undefined)
   - Undefined/missing = treat as null (all allowed)
4. If invalid:
   - Return 401 (unauthorized)
```

### 5. Frontend Logic (`js/site.js`)

Enforces profile restrictions in the UI.

**Key State:**
```javascript
state = {
  allowedProfiles: null,  // null = all allowed, array = restricted
  profile: "developer",
  lang: "en",
  // ...
}
```

**Main Functions:**

```javascript
// Fetch allowed profiles from API
fetchAllowedProfiles()
// Returns: null (all), array (restricted), or null (error)

// Check if specific profile is allowed
isProfileAllowed("sdr")  // true/false

// Get filtered list of available profiles
getAvailableProfiles()
// PROFILES.filter(p => allowedProfiles === null || allowedProfiles.includes(p))

// Get filtered list of available languages
getAvailableLanguages()
// LANGS.filter(l => allowedProfiles === null || allowedProfiles.includes(l))
```

**Initialization Flow:**
```javascript
1. init() called on DOMContentLoaded
2. Set state.page
3. fetchAllowedProfiles() → state.allowedProfiles
4. readPrefs() → validates profile/lang against allowed list
5. Load i18n, profile data, projects
6. renderHeader() → builds dropdowns with filtered options
7. renderResumePage() or renderWorkPage()
```

**Header Rendering:**
```javascript
// Build dropdown options only from available profiles
availableProfiles.map(id => `<option value="${id}">${t("switcher." + id)}</option>`)

// Hide dropdown if only 1 option available
availableLangs.length > 1 ? '<label>...</label>' : ''
```

**Profile Validation:**
```javascript
// When user selects profile:
if (!isProfileAllowed(newProfile)) {
  state.profile = getAvailableProfiles()[0]  // Reset to first allowed
}

// When URL changes to disallowed profile:
readPrefs() checks: PROFILES.indexOf(profile) !== -1
// If not in allowed list, uses first allowed profile instead
```

## Data Flow Examples

### Example 1: Creating Restricted Token

**Command:**
```bash
ACCESS_TOKEN_SECRET="..." node scripts/issue-invite.mjs \
  --days 7 --label "SDR Sales" --profiles sdr pt-BR
```

**Execution:**
```
1. readArg("--profiles") finds index of --profiles flag
2. Loop: collect ["sdr", "pt-BR"] from remaining args
3. createInviteToken(secret, { days: 7, label: "SDR Sales", profiles: ["sdr", "pt-BR"] })
4. Payload generated:
   {
     "typ": "invite",
     "exp": (now + 7*86400),
     "iat": now,
     "jti": "uuid",
     "label": "SDR Sales",
     "profiles": ["sdr", "pt-BR"]
   }
5. Sign payload with HMAC-SHA256
6. Output: v1.{encoded_payload}.{signature}
7. Construct URL: /unlock.html?invite=v1.{token}
```

### Example 2: Unlocking Token

**User clicks:** `https://example.com/unlock.html?invite=v1.eyJ0...`

**Execution:**
```
1. unlock.html parses URL param, extracts token
2. POST /api/unlock { token: "v1...", next: "/developer.html" }
3. api/unlock.js:
   - verifyInviteToken(token, secret)
   - Checks: format (has 3 dots) ✓
   - Checks: signature (HMAC matches) ✓
   - Checks: type "invite" ✓
   - Checks: expiration (not expired) ✓
   - Payload: { typ: "invite", profiles: ["sdr", "pt-BR"], ... }
4. createSessionToken(secret, payload):
   - New payload: { typ: "session", via: payload.jti, profiles: ["sdr", "pt-BR"], ... }
   - Sign with HMAC-SHA256
   - Return session token
5. Set-Cookie: fl_session=v1.eyJ0eXA...
6. Return: { ok: true, redirect: "/developer.html" }
7. Browser redirected, cookie sent with request
```

### Example 3: Loading Site with Restrictions

**User navigates to:** `/index.html`

**Execution:**
```
1. site.js init() called
2. fetchAllowedProfiles():
   - Fetch /api/profile-access
   - Cookie sent: fl_session=v1...
   - api/profile-access.js:
     - parseCookie finds fl_session
     - verifySessionToken(session, secret) ✓
     - Returns payload.profiles = ["sdr", "pt-BR"]
   - Returns { ok: true, profiles: ["sdr", "pt-BR"] }
   - state.allowedProfiles = ["sdr", "pt-BR"]
3. readPrefs():
   - availableProfiles = ["sdr"]  (filtered from full PROFILES list)
   - availableLangs = ["pt-BR"]   (filtered from full LANGS list)
   - URL param profile="developer" not in available, use "sdr"
   - URL param lang="en" not in available, use "pt-BR"
4. renderHeader():
   - Profile dropdown: only <option value="sdr">Sales...</option>
   - Language dropdown: only <option value="pt-BR">PT-BR</option>
5. Load profile data for "sdr", translations for "pt-BR"
6. Display restricted content
```

## Extending the System

### Add a New Profile

1. **Create profile data file:**
   ```bash
   cp data/profiles/sdr.json data/profiles/newprofile.json
   # Edit file with new content
   ```

2. **Update frontend:**
   ```javascript
   // In js/site.js, change:
   var PROFILES = ["developer", "sdr", "corretor", "newprofile"];
   ```

3. **Create token:**
   ```bash
   node scripts/issue-invite.mjs --profiles newprofile en
   ```

### Add a New Language

1. **Create translation file:**
   ```bash
   cp data/i18n/en.json data/i18n/fr.json
   # Translate content to French
   ```

2. **Update frontend:**
   ```javascript
   // In js/site.js, change:
   var LANGS = ["en", "pt-BR", "es", "fr"];
   ```

3. **Create token:**
   ```bash
   node scripts/issue-invite.mjs --profiles developer fr
   ```

### Add Token Revocation

Current system: Can't revoke, only wait for expiration or rotate secret (invalidates all tokens).

To add revocation:

1. **Create blocklist database:**
   ```javascript
   // In api/unlock.js
   const blockedTokens = new Set();  // Or check database
   if (blockedTokens.has(payload.jti)) {
     return Response.json({ ok: false, error: "revoked" }, { status: 401 });
   }
   ```

2. **Create revoke endpoint:**
   ```javascript
   // POST /api/revoke { jti: "..." }
   // Add jti to blocklist
   ```

3. **Add CLI command:**
   ```bash
   node scripts/revoke-invite.mjs --jti d3c0be88-...
   ```

### Add Usage Logging

```javascript
// In api/unlock.js, after successful verification:
console.log({
  timestamp: new Date().toISOString(),
  jti: payload.jti,
  label: payload.label,
  profiles: payload.profiles,
  sessionHours: sessionHours,
  ipAddress: request.headers.get('x-forwarded-for')
});

// In api/profile-access.js:
console.log({
  timestamp: new Date().toISOString(),
  jti: payload.via,
  profiles: payload.profiles
});
```

## Testing

### Unit Tests (Token Library)

```javascript
// Test token creation
const result = await createInviteToken(secret, { 
  days: 1, 
  profiles: ["sdr", "pt-BR"] 
});
assert(result.payload.profiles.includes("sdr"));
assert(result.payload.exp > now);

// Test verification
const verified = await verifyInviteToken(result.token, secret);
assert(verified.ok === true);
assert(verified.payload.profiles.includes("pt-BR"));

// Test tampering detection
const tampered = result.token.slice(0, -5) + "aaaaa";
const verified = await verifyInviteToken(tampered, secret);
assert(verified.ok === false);
assert(verified.reason === "signature");
```

### Integration Tests (Full Flow)

```bash
# Create token
TOKEN=$(node scripts/issue-invite.mjs --days 1 --profiles sdr | grep "^v1")

# Simulate unlock
curl -X POST http://localhost:3000/api/unlock \
  -H "Content-Type: application/json" \
  -d "{ \"token\": \"$TOKEN\", \"next\": \"/\" }"

# Should return { ok: true, redirect: "/" } and set cookie

# Check profile access
curl http://localhost:3000/api/profile-access \
  -H "Cookie: fl_session=$SESSION_TOKEN"

# Should return { ok: true, profiles: ["sdr"] }
```

## Debugging

### Check Token Structure

```javascript
// Decode a token (client-side)
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]
  .replace(/-/g, '+')
  .replace(/_/g, '/')
));
console.log(payload);
// Should show: typ, exp, profiles, etc.
```

### Check Signature

```javascript
// In browser console:
const token = "v1.eyJ0eXAi...";
const secret = "your-secret";

// This requires access to crypto API (same as backend)
// For debugging, check server logs instead
```

### Vercel Function Logs

```bash
# View live logs
vercel logs api/unlock --follow

# View specific function
vercel logs api/profile-access --follow
```

### Environment Check

```bash
# Verify secrets match
# Local: cat .env.local | grep ACCESS_TOKEN_SECRET
# Vercel: vercel env ls

# Verify gate enabled
# Should have ACCESS_GATE_ENABLED=true on Vercel
```

## Security Considerations

1. **Never log the secret** — Only log the JTI (token ID)
2. **HTTPOnly cookies** — Session tokens can't be stolen via XSS
3. **SameSite=Lax** — CSRF protection for unlock endpoint
4. **HTTPS only** — Cookies marked Secure (production only)
5. **Token expiration** — Design session duration carefully
6. **No client-side validation** — Server-side signature is authoritative

## Performance Notes

- Token verification: ~1ms (HMAC-SHA256 is fast)
- Database lookup (if added): Depends on backend
- `/api/profile-access` called once per page load
- Dropdowns rendered once, no re-verification on select
