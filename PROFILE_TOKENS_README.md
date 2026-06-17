# Profile-Restricted Invite Tokens

## What Is This?

A system to create **time-limited, profile-restricted invite links** for the Facundo Leis résumé site. You can generate links that:

- ✅ Expire after a set number of days (1-90)
- ✅ Restrict access to specific profiles (SDR, Developer, Real Estate Broker)
- ✅ Restrict access to specific languages (Portuguese, English, Spanish)
- ✅ Are cryptographically signed and tamper-proof
- ✅ Create a 24-hour session when unlocked

**Example:** Create a link that only shows the Developer profile in English for exactly 7 days.

## Use Cases

| Scenario | Command |
|----------|---------|
| Recruiting for tech role | `--profiles developer en` |
| Sales prospecting | `--profiles sdr pt-BR` |
| Real estate partnership | `--profiles corretor pt-BR` |
| Mixed audience (some English, some Portuguese) | `--profiles developer en sdr pt-BR` |
| Product demo to multiple people | No `--profiles` (unrestricted) |
| Time-limited portfolio review | `--days 3` (expires in 3 days) |

## Quick Start

**1. Get your secret (one-time setup)**
```bash
# Copy from Vercel → Project Settings → Environment Variables
export ACCESS_TOKEN_SECRET="af909c259dfc98b4ec..." # min 32 chars
```

**2. Create a link**
```bash
node scripts/issue-invite.mjs \
  --days 7 \
  --label "My Recipient's Name" \
  --profiles sdr pt-BR
```

**3. Send the "Share link" to your recipient**

They click the link → see only SDR profile in Portuguese → their session lasts 24 hours.

## Documentation

Choose your reading style:

### 👤 For Most People
**[PROFILE_TOKENS_QUICKSTART.md](./PROFILE_TOKENS_QUICKSTART.md)** — Copy-paste commands for common scenarios.
- 5 minutes to read
- Examples: SDR links, developer links, multi-language links
- Troubleshooting table

### 📖 For Complete Understanding
**[PROFILE_TOKENS.md](./PROFILE_TOKENS.md)** — Full documentation.
- 20 minutes to read
- How tokens work under the hood
- Security best practices
- Testing and troubleshooting guide
- API reference for developers

### 👨‍💻 For Developers
**[PROFILE_TOKENS_DEV_GUIDE.md](./PROFILE_TOKENS_DEV_GUIDE.md)** — Technical implementation details.
- 30 minutes to read
- Architecture diagrams
- Code walkthrough
- How to extend the system
- Debug techniques

## What Changed

### Modified Files
- **`lib/token.mjs`** — Token generation now accepts profile restrictions
- **`scripts/issue-invite.mjs`** — Added `--profiles` argument
- **`js/site.js`** — Frontend now filters profiles based on token restrictions

### New Files
- **`api/profile-access.js`** — API endpoint to check allowed profiles
- **`PROFILE_TOKENS.md`** — Full documentation
- **`PROFILE_TOKENS_QUICKSTART.md`** — Quick reference
- **`PROFILE_TOKENS_DEV_GUIDE.md`** — Technical guide

## How It Works (30-second version)

1. **Create**: Script generates a signed token with allowed profiles/expiration
2. **Share**: Send recipient a link with the token in the URL
3. **Unlock**: Recipient clicks link → token is verified → session cookie created
4. **Restrict**: Frontend checks allowed profiles → hides restricted options
5. **Auto-enforce**: If user tries to access restricted profile, redirects to allowed one

**Security**: Tokens are HMAC-SHA256 signed. Can't be modified without knowing your secret.

## Command Reference

### Basic (no restrictions)
```bash
node scripts/issue-invite.mjs --days 7 --label "Client Name"
```

### Restrict to profile + language
```bash
node scripts/issue-invite.mjs --days 7 --label "SDR" --profiles sdr pt-BR
```

### Multiple combinations
```bash
node scripts/issue-invite.mjs --days 7 --label "Team" \
  --profiles developer en sdr pt-BR
```

### Available profiles
- `developer` — Software Developer
- `sdr` — Sales Development Representative
- `corretor` — Real Estate Broker

### Available languages
- `en` — English
- `pt-BR` — Portuguese (Brazil)
- `es` — Spanish

## What Recipients See

### Token: `--profiles sdr pt-BR`
- ✅ Profile dropdown shows only: Sales Development Representative
- ✅ Language dropdown shows only: PT-BR
- ❌ Can't access: Developer, Corretor, or other languages
- 🔄 Auto-switches: If they try to change language, reverts to Portuguese

### Token: `--profiles developer` (no language restriction)
- ✅ Profile dropdown shows only: Software Developer
- ✅ Language dropdown shows all: EN, PT-BR, ES
- ✅ Can switch languages freely
- ❌ Can't access: SDR or Corretor

### Token: (no `--profiles` flag)
- ✅ All profiles visible
- ✅ All languages visible
- ✅ Full unrestricted access

## Testing Locally

```bash
# 1. Start dev server
npx serve .

# 2. Create a test token
export ACCESS_TOKEN_SECRET="..."
node scripts/issue-invite.mjs --days 1 --profiles developer en

# 3. Visit the URL or open unlock.html and paste token

# 4. Verify only Developer profile and English language appear
```

## Common Patterns

```bash
# Pattern 1: One profile, one language
node scripts/issue-invite.mjs --days 7 --label "Recruiter" \
  --profiles developer en

# Pattern 2: One profile, all languages
node scripts/issue-invite.mjs --days 14 --label "Partner" \
  --profiles corretor pt-BR en es

# Pattern 3: Multiple profiles, multiple languages
node scripts/issue-invite.mjs --days 7 --label "Mixed Team" \
  --profiles sdr pt-BR developer en

# Pattern 4: All profiles, all languages (unrestricted)
node scripts/issue-invite.mjs --days 3 --label "General Demo"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Token works but shows all profiles | Verify `--profiles` was in the command when created |
| Link doesn't work | Check `ACCESS_GATE_ENABLED=true` on Vercel |
| Session expires | Default is 24 hours; they must unlock again |
| Token won't verify | Ensure `ACCESS_TOKEN_SECRET` on Vercel matches local |

For more troubleshooting, see [PROFILE_TOKENS.md](./PROFILE_TOKENS.md#troubleshooting).

## Security

- ✅ **Tokens are signed** — Can't modify without secret
- ✅ **Time-limited** — Automatically expire
- ✅ **Session separate** — Session token in HttpOnly cookie (XSS-safe)
- ✅ **Unique per token** — Includes random JTI for future revocation
- ✅ **Minimal info** — Only label stored (no PII)

**Never commit your `ACCESS_TOKEN_SECRET`** — Use environment variables.

## Future Enhancements

Possible improvements:
- Token revocation database
- Usage analytics and logging
- QR codes for sharing
- IP address binding
- Granular permissions (sections, not just profiles)

See [PROFILE_TOKENS_DEV_GUIDE.md](./PROFILE_TOKENS_DEV_GUIDE.md#extending-the-system) for implementation ideas.

## API Reference

### Token Creation (CLI)
```bash
node scripts/issue-invite.mjs [options]

Options:
  --site <url>              Base URL (default: SITE_BASE_URL env var)
  --days <1-90>             Expiration days (default: 7)
  --label <string>          Human-readable identifier
  --profiles <list>         Space-separated profile/language codes
```

### Unlock Endpoint
```
POST /api/unlock
Content-Type: application/json

{
  "token": "v1.eyJ0eXA...",
  "next": "/path"
}

Response:
{
  "ok": true,
  "redirect": "/path"
}

Set-Cookie: fl_session=...
```

### Profile Access Endpoint
```
GET /api/profile-access
Cookie: fl_session=...

Response:
{
  "ok": true,
  "profiles": ["sdr", "pt-BR"]  // null = all allowed
}
```

## Questions?

- **Quick reference?** → [PROFILE_TOKENS_QUICKSTART.md](./PROFILE_TOKENS_QUICKSTART.md)
- **Full details?** → [PROFILE_TOKENS.md](./PROFILE_TOKENS.md)
- **Technical implementation?** → [PROFILE_TOKENS_DEV_GUIDE.md](./PROFILE_TOKENS_DEV_GUIDE.md)
- **Help with git?** → Check the `CLAUDE.md` file in the project root

## Example Links

Here are 7-day test links (expiring 2026-06-24):

**SDR Portuguese Only:**
```
https://curriculo-beta-seven.vercel.app/unlock.html?invite=v1.eyJ0eXAiOiJpbnZpdGUiLCJleHAiOjE3ODIzMDk3NzMsImlhdCI6MTc4MTcwNDk3MywianRpIjoiZDNjMGJlODgtMmRmZS00NTQyLWE3ZTItZTY4ZWFjNmEyNTlmIiwibGFiZWwiOiJTRFIgU2FsZXMgUG9ydHVndWVzZSIsInByb2ZpbGVzIjpbInNkciIsInB0LUJSIl19.n1A14zovBxxwNMqLy7Puka54IqmK00BIaVqHHEEADvQ
```

**Developer English Only:**
```
https://curriculo-beta-seven.vercel.app/unlock.html?invite=v1.eyJ0eXAiOiJpbnZpdGUiLCJleHAiOjE3ODIzMDk4MzAsImlhdCI6MTc4MTcwNTAzMCwianRpIjoiNmE3YzA0ZjYtODYxOS00MTU1LTkyNDYtY2YwNGQ0ZjNiYjhjIiwibGFiZWwiOiJEZXZlbG9wZXIgRW5nbGlzaCIsInByb2ZpbGVzIjpbImRldmVsb3BlciIsImVuIl19.MKCRVf1PWKU4ge_5SnzXH5nSPdONuWLxAOFgYxCXr0k
```

**Full Access (All Profiles/Languages):**
```
https://curriculo-beta-seven.vercel.app/unlock.html?invite=v1.eyJ0eXAiOiJpbnZpdGUiLCJleHAiOjE3ODIzMDk4NDcsImlhdCI6MTc4MTcwNTA0NywianRpIjoiYjlhYzgzZWYtNzNjZC00MGI3LTk2MTAtOWVmZWZjM2MyOTJjIiwibGFiZWwiOiJGdWxsIEFjY2VzcyBEZW1vIn0.z1qkWHBDQ1jtRUP-RoEyxugI5udiJpA4hvWRfh1Vt9U
```

---

**Created:** 2026-06-17  
**Last Updated:** 2026-06-17
