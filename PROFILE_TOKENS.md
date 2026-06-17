# Profile-Restricted Access Tokens

This guide explains how to create time-limited invite links that restrict access to specific profiles and languages in the Facundo Leis résumé site.

## Overview

The token system allows you to:
- **Create time-limited invite links** (valid 1-90 days)
- **Restrict access to specific profiles** (sdr, developer, corretor)
- **Combine with language/region codes** for language-specific links (pt-BR, en, es)
- **Track who has access** with descriptive labels

## Available Profiles

The résumé site contains the following profiles:

- **sdr** — Sales Development Representative profile
- **developer** — Software Developer profile  
- **corretor** — Real Estate Broker (Corretor) profile

Each profile can be available in multiple languages via language codes:
- **pt-BR** — Portuguese (Brazil)
- **en** — English
- **es** — Spanish

## Creating Profile-Restricted Tokens

### Setup: Set Your Secret

Before running the script, set your `ACCESS_TOKEN_SECRET` environment variable. This must match the secret configured in your Vercel environment:

```bash
export ACCESS_TOKEN_SECRET="your-secret-key-here-min-32-chars"
```

**⚠️ IMPORTANT:** 
- Use the same secret as your Vercel `ACCESS_TOKEN_SECRET` environment variable
- Never commit this secret to git
- Use a cryptographically secure secret of at least 32 characters

### Basic Token Creation (No Profile Restriction)

Create a 7-day token with no profile restrictions (allows access to all profiles):

```bash
node scripts/issue-invite.mjs \
  --site https://facundo-leis.vercel.app \
  --days 7 \
  --label "Client Name"
```

### Create Tokens for Specific Profiles

#### Example 1: SDR Profile in Portuguese

Create a token that only allows access to the SDR profile in Portuguese:

```bash
node scripts/issue-invite.mjs \
  --site https://facundo-leis.vercel.app \
  --days 7 \
  --label "SDR Sales Portuguese" \
  --profiles sdr pt-BR
```

#### Example 2: Developer Profile in English

Create a token for the Developer profile in English:

```bash
node scripts/issue-invite.mjs \
  --site https://facundo-leis.vercel.app \
  --days 7 \
  --label "Developer English" \
  --profiles developer en
```

#### Example 3: Multiple Profiles

Create a token with access to both SDR and Developer profiles:

```bash
node scripts/issue-invite.mjs \
  --site https://facundo-leis.vercel.app \
  --days 14 \
  --label "Sales Team Review" \
  --profiles sdr developer
```

#### Example 4: Specific Profile with All Languages

Create a token for the Corretor profile available in all languages:

```bash
node scripts/issue-invite.mjs \
  --site https://facundo-leis.vercel.app \
  --days 3 \
  --label "Real Estate Partner" \
  --profiles corretor pt-BR en es
```

## Command-Line Options

```
--site <url>
  Base URL of the résumé site (default: SITE_BASE_URL env var or https://YOUR-APP.vercel.app)
  Example: https://facundo-leis.vercel.app

--days <number>
  Number of days the token is valid (1-90, default: 7)
  Example: --days 30

--label <string>
  Descriptive label for tracking who this link was issued to
  Example: --label "Acme Corp Recruiter"

--profiles <profile> [<profile>...]
  Space-separated list of allowed profiles and language codes
  If not specified, all profiles are accessible
  Profiles: sdr, developer, corretor
  Languages: pt-BR, en, es
  Example: --profiles sdr developer pt-BR en
```

## Script Output

When you run the script, you'll get output like:

```
Invite label : SDR Sales Portuguese
Valid for    : 7 day(s)
Expires (UTC): 2026-06-24T15:30:45.123Z
Profiles     : sdr, pt-BR

Share link:
https://facundo-leis.vercel.app/unlock.html?invite=v1.eyJ0eXAiOiJpbnZpdGUiLCJleHAiOjE3...

Raw token (manual paste on unlock page):
v1.eyJ0eXAiOiJpbnZpdGUiLCJleXAiOjE3...
```

Copy the **Share link** and send it to your recipient.

## How It Works

### Step 1: Token Creation
The script generates a cryptographically signed token with:
- **Expiration timestamp** — When the token expires (UTC)
- **Allowed profiles** — Profiles and languages restricted (e.g., `["sdr", "pt-BR"]`)
- **Unique ID** — For tracking and revocation (in future versions)
- **Label** — Description of who this token was issued to

Example encoded payload:
```json
{
  "typ": "invite",
  "exp": 1782309773,
  "iat": 1781704973,
  "jti": "d3c0be88-2dfe-4542-a7e2-e68eac6a259f",
  "label": "SDR Sales Portuguese",
  "profiles": ["sdr", "pt-BR"]
}
```

### Step 2: Token Sharing
Share the token via:
- **Direct link** — Copy the full `/unlock.html?invite=...` URL
- **Manual unlock page** — User pastes the raw token on `/unlock.html`

### Step 3: Initial Unlock
When someone visits the unlock page:
1. The token signature is **verified** using HMAC-SHA256
2. Expiration is **checked** — must not be in the past
3. A **session cookie** is created (`fl_session`) valid for 24 hours
4. User is **redirected** to the resume page

### Step 4: Profile Access Enforcement
When the user loads the site (now with a valid session):
1. **Frontend checks allowed profiles** via `/api/profile-access`
   - Returns `null` if all profiles allowed (backwards compatible)
   - Returns array like `["sdr", "pt-BR"]` if restricted
2. **Profile dropdown** only shows allowed profiles
3. **Language dropdown** only shows allowed languages
4. **If current profile not allowed** — automatically switches to first allowed profile
5. **Content filtered** — Projects filtered to match allowed profiles

Example: Token restricts to `["sdr", "pt-BR"]`
- ✅ Can view: SDR profile in Portuguese
- ❌ Cannot view: Developer, Corretor, or English/Spanish versions
- 🔄 Auto-switches: If language changed to English, reverts to Portuguese
- 🚫 Dropdown hides: Only shows available options

## Using with Environment Variables

For automation, you can set environment variables instead of command-line arguments:

```bash
SITE_BASE_URL=https://facundo-leis.vercel.app \
ACCESS_TOKEN_SECRET="your-secret" \
node scripts/issue-invite.mjs --days 7 --label "Auto-generated"
```

## Security Best Practices

1. **Secret Management**
   - Store `ACCESS_TOKEN_SECRET` in your `.env.local` or Vercel secrets
   - Never log or commit the secret
   - Rotate secrets periodically

2. **Token Expiration**
   - Use shorter expiration times (1-7 days) for sensitive profiles
   - Use longer times only for trusted, long-term relationships

3. **Labeling**
   - Use clear, descriptive labels to track who has each token
   - Include recipient name and date in the label

4. **Sharing**
   - Share tokens via secure channels (email, password manager, etc.)
   - Don't post tokens in public repositories or documentation

## Testing Profile-Restricted Tokens

### Local Testing
To test profile restrictions locally:

1. **Start the dev server:**
   ```bash
   npx serve .
   ```

2. **Visit the unlock page** with your test token:
   ```
   http://localhost:3000/unlock.html?invite=v1.eyJ0eXAiOiJpbnZpdGUiLC...
   ```

3. **Observe the behavior:**
   - Only allowed profiles appear in the "Profile" dropdown
   - Only allowed languages appear in the "Language" dropdown
   - If you try to access a profile via URL param, it resets to allowed one
   - Content (projects, experience) filters to selected profile

### Verification on Live Site

1. **Copy the share link** from the script output
2. **Send to test recipient** or test yourself
3. **Verify restrictions:**
   - Click the link or paste token on unlock page
   - Check that **only allowed profiles/languages** appear in dropdowns
   - Try accessing disallowed profiles via URL manipulation — should auto-reset
   - Verify **session expires** after configured duration (default 24h)

### Example Test Cases

**Token restricted to: `sdr pt-BR`**
```bash
node scripts/issue-invite.mjs \
  --site https://curriculo-beta-seven.vercel.app \
  --days 1 \
  --label "Test SDR Portuguese Only" \
  --profiles sdr pt-BR
```

Expected behavior:
- ✅ Profile dropdown: Only "Sales Development Representative" visible
- ✅ Language dropdown: Only "PT-BR" visible
- ✅ URL param `?profile=developer` → resets to `sdr`
- ✅ URL param `?lang=en` → resets to `pt-BR`
- ❌ Cannot view developer.json content

**Token with no restrictions:**
```bash
node scripts/issue-invite.mjs \
  --site https://curriculo-beta-seven.vercel.app \
  --days 1 \
  --label "Test Full Access" \
  # no --profiles flag
```

Expected behavior:
- ✅ All 3 profiles in dropdown
- ✅ All 3 languages in dropdown
- ✅ Can switch between any profile/language
- ✅ `/api/profile-access` returns `"profiles": null`

## Checking Token Validity

When you create a token, verify it shows:

```
Invite label : SDR Sales Portuguese
Valid for    : 7 day(s)
Expires (UTC): 2026-06-24T15:30:45.123Z
Profiles     : sdr, pt-BR
```

**Checklist:**
- ✅ Expiration date is correct (today + days specified)
- ✅ Label clearly identifies the recipient
- ✅ Profiles list shows exactly what you intended
- ✅ Share link is long (contains encoded payload)
- ✅ Raw token starts with `v1.` prefix

## Revoking Access

Currently, tokens cannot be revoked once issued. To prevent access:
1. Wait for the token to expire
2. Rotate your `ACCESS_TOKEN_SECRET` (this invalidates all tokens)

## Troubleshooting

### Token Creation Issues

**"ACCESS_TOKEN_SECRET must be at least 32 characters"**
Your secret is too short. Generate a longer one:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**"--days must be between 1 and 90"**
Use a value between 1 and 90 days (e.g., `--days 14`)

### Token Doesn't Work on Site

**Issue:** Token accepted but no access
1. ✅ Verify `ACCESS_TOKEN_SECRET` matches on Vercel (check Vercel → Project Settings → Environment Variables)
2. ✅ Check token hasn't expired (see expiration time in script output)
3. ✅ Ensure `ACCESS_GATE_ENABLED=true` on Vercel (required to enforce gating)
4. ✅ Clear browser cookies: `localStorage.clear()` in browser console

**Issue:** Unlock page accepts token but redirects back to unlock
- This means `/api/unlock` successfully created a session
- Problem is likely in the middleware redirecting to unlock again
- Check that the session cookie is being set (DevTools → Application → Cookies)

### Profile Restrictions Not Enforcing

**Issue:** Can see all profiles even though token restricted**

1. **Check `/api/profile-access` is working:**
   ```javascript
   // In browser console:
   fetch('/api/profile-access').then(r => r.json()).then(console.log)
   // Should show: {ok: true, profiles: ["sdr", "pt-BR"]} (or null if unrestricted)
   ```

2. **Check token has profiles:**
   ```bash
   # Decode the token manually to inspect:
   # Copy the token and decode the middle section (between dots)
   # It should contain: "profiles":["sdr","pt-BR"]
   ```

3. **Check browser console for errors:**
   - Open DevTools (F12) → Console tab
   - Look for 404 or 500 errors from `/api/profile-access`
   - Check for JavaScript errors in site.js

4. **Clear and retry:**
   ```javascript
   localStorage.clear()
   location.reload()
   ```

**Issue:** Profile dropdown shows all profiles (should be filtered)**

Likely causes:
- `/api/profile-access` returns `null` (unrestricted token, expected behavior)
- `/api/profile-access` request failed (check console errors)
- Vercel `ACCESS_GATE_ENABLED` not set to `true`

To debug:
```javascript
// In browser console:
fetch('/api/profile-access').then(r => r.json()).then(d => {
  console.log('Response:', d);
  console.log('Profiles:', d.profiles);
})
```

**Issue:** Can't switch back to a restricted profile after trying to access unrestricted one**

This is expected behavior! If your token allows only `["sdr", "pt-BR"]`:
- You view the site in Portuguese ✅
- You try to change language to English (URL: `?lang=en`)
- Site resets to Portuguese (because English not allowed)
- You can't manually force English via URL

This is a security feature — profile restrictions are enforced on every page load.

### Advanced Debugging

**Enable API logging:**
- Check Vercel Function logs: Dashboard → Project → Deployments → Logs
- Check `/api/profile-access` is returning correct data

**Check session token validity:**
```javascript
// In browser console (after unlocking):
document.cookie.split('; ').find(c => c.startsWith('fl_session'))
// Should show a long token starting with v1.
```

**Verify environment variable sync:**
- Change `ACCESS_TOKEN_SECRET` locally in `.env.local`
- Regenerate token
- Test on `localhost:3000` (should work with local secret)
- Ensure same secret is on Vercel (should work on production)

## Examples by Use Case

### Recruiting/HR
```bash
node scripts/issue-invite.mjs \
  --site https://facundo-leis.vercel.app \
  --days 7 \
  --label "Tech Recruiter - Acme Corp" \
  --profiles developer en
```

### Sales Outreach
```bash
node scripts/issue-invite.mjs \
  --site https://facundo-leis.vercel.app \
  --days 3 \
  --label "Sales Lead - João Silva" \
  --profiles sdr pt-BR
```

### Partner Review
```bash
node scripts/issue-invite.mjs \
  --site https://facundo-leis.vercel.app \
  --days 30 \
  --label "Real Estate Partner - Broker Network" \
  --profiles corretor
```

### Demo/Testing
```bash
node scripts/issue-invite.mjs \
  --site https://facundo-leis.vercel.app \
  --days 1 \
  --label "Demo - Testing"
  # No profiles specified = access to all
```

## API Reference

### POST /api/unlock
Exchange an invite token for a session cookie.

**Request:**
```json
{
  "token": "v1.eyJ0eXAiOiJpbnZpdGUiLCJleHAiOjE3...",
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

Sets `fl_session` cookie with encrypted session token.

### GET /api/profile-access
Check which profiles the current session has access to.

**Response (full access):**
```json
{
  "ok": true,
  "profiles": null
}
```

**Response (restricted access):**
```json
{
  "ok": true,
  "profiles": ["sdr", "pt-BR"]
}
```

If `profiles` is `null`, all profiles are accessible. If it's an array, only those profiles are accessible.

## Technical Implementation Details

### Files Modified

**`lib/token.mjs`**
- `createInviteToken()` — Now accepts `options.profiles` array
- `createSessionToken()` — Copies profiles from invite token to session token

**`scripts/issue-invite.mjs`**
- Added `--profiles` argument parsing (space-separated values)
- Displays profiles in output for verification

**`api/profile-access.js`** (NEW)
- Edge Function that reads session cookie
- Returns allowed profiles array or `null` (unrestricted)
- Returns 401 if no valid session

**`js/site.js`**
- `fetchAllowedProfiles()` — Calls `/api/profile-access` on page load
- `getAvailableProfiles()` — Returns filtered PROFILES array
- `getAvailableLanguages()` — Returns filtered LANGS array
- `readPrefs()` — Validates language/profile against allowed list
- `renderHeader()` — Filters dropdown options, hides if only 1 choice

### Security Model

1. **Token Signing** — HMAC-SHA256 prevents tampering
   - Can't modify profiles in token without knowing secret
   - Can't create valid tokens without secret

2. **Server-Side Validation** — Profiles enforced on every unlock
   - `/api/unlock` verifies token signature
   - Token payload copied to session cookie
   - Can't bypass by modifying cookies (different format, requires secret)

3. **Client-Side Filtering** — UX enforcement, not security
   - Frontend filters dropdowns (convenience)
   - Frontend auto-resets to allowed profile when URL param invalid
   - Not a security boundary — session token is authoritative

### Extending Profile Restrictions

To add more profile/language combinations:

**Option 1: Add profiles (recommended)**
- Add files to `data/profiles/` directory
- Add profile names to `PROFILES` array in `site.js`
- Create corresponding translations in `data/i18n/`

**Option 2: Add language codes**
- Add language code to `LANGS` array in `site.js`
- Add translations to `data/i18n/[lang].json` files
- Use in token like: `--profiles developer fr`

**Option 3: Add profile+language combinations**
- Create tokens like: `--profiles developer pt-BR es` (mixed)
- Frontend will filter based on exact match
- Example: Allows Developer in all languages, but not SDR

### Future Enhancements

Possible improvements to consider:

- **Token Revocation** — Track JTI (token ID) in database, revoke by ID
- **Time-based Rotation** — Require periodic re-authentication
- **Usage Limits** — Limit number of times a token can be used
- **IP Binding** — Restrict token to specific IP addresses
- **Activity Logging** — Log which profiles accessed and when
- **QR Codes** — Generate QR code for easy sharing
- **Granular Permissions** — Restrict to specific sections (skills, projects, etc.)

### Token Payload Schema

```typescript
interface InvitePayload {
  typ: "invite";
  exp: number;           // Expiration time (Unix timestamp, seconds)
  iat: number;           // Issued at time
  jti: string;           // JWT ID (unique identifier)
  label: string;         // Human-readable label
  profiles?: string[];   // Optional: allowed profiles/languages
}

interface SessionPayload {
  typ: "session";
  exp: number;
  iat: number;
  jti: string;
  via: string;           // Reference to invite JTI
  label: string;
  profiles?: string[];   // Inherited from invite token
}
```

### Environment Variables

**Required:**
- `ACCESS_TOKEN_SECRET` — Min 32 characters, HMAC key (set on Vercel)
- `ACCESS_GATE_ENABLED` — "true" to enable gating (set on Vercel)

**Optional:**
- `SITE_BASE_URL` — Base URL for generated links (default used if not set)
- `SESSION_HOURS` — Session duration in hours (default: 24)

All must be set identically in local `.env.local` and Vercel environment variables.
