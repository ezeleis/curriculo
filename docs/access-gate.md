# Access gate (SHOWCASE)

Private invite-only access for the résumé site when deployed on **Vercel with Edge Middleware**.

## Why not GitHub Pages alone?

GitHub Pages serves **static files**. Anyone can fetch `/data/profiles/developer.json` directly. A password in client-side JavaScript is bypassable (view source, disable JS, curl).

**Real gating requires server-side enforcement** before content is served. This implementation uses Vercel Edge Middleware + a signed-token unlock API.

| Deployment | Gate works? |
|---|---|
| Vercel + env vars set | Yes |
| Local `npx serve` (gate off) | No — dev mode |
| GitHub Pages (`*.github.io`) | **No** — disable or publish only a public stub |

## Threat model

**Protects against**

- Casual browsing / search engine indexing (with `noindex` on unlock page)
- Direct URL access without a valid invite
- Direct fetch of `/data/*` and `/js/*` without a session cookie
- Expired or tampered invite links (HMAC-SHA256)

**Does not protect against**

- Someone you shared a valid link with forwarding it
- Screen capture / copy-paste of content after unlock
- Determined attacker with a leaked `ACCESS_TOKEN_SECRET` (rotate secret and redeploy)

**Not “unbreakable”** — no web gate is. This is **appropriate for recruiter sharing**, not classified data.

## Flow

```text
You (local CLI)                Visitor
     |                              |
     | issue-invite.mjs             |
     |-- signed invite token ------> opens /unlock.html?invite=TOKEN
     |                              POST /api/unlock
     |                              <- Set-Cookie: fl_session (HttpOnly)
     |                              -> CV + work pages
Edge middleware on every request validates fl_session cookie
```

## Setup (Vercel)

1. Import repo `ezeleis/curriculo` on Vercel (or link existing project).
2. **Environment variables** (Production + Preview):

   | Variable | Value |
   |---|---|
   | `ACCESS_GATE_ENABLED` | `true` |
   | `ACCESS_TOKEN_SECRET` | 32+ char random secret (same for all envs) |
   | `SESSION_HOURS` | `24` (optional) |

3. Deploy from `main` after PR merge.
4. **Disable GitHub Pages** or stop publishing full site there — otherwise content stays public on `github.io`.

Generate secret (PowerShell):

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Issue an invite link

### Option A — easiest day-to-day (recommended)

One-time setup:

```powershell
cd c:\Users\Admin\Projects\facundo-leis-resume
Copy-Item .env.example .env.local
# Edit .env.local — paste SITE_BASE_URL and ACCESS_TOKEN_SECRET from Vercel
```

Every time you need a link:

```powershell
node scripts/issue-invite.mjs --label "Google recruiter"
```

Or shorter:

```powershell
.\scripts\invite.ps1 -Label "Google recruiter"
```

### Option B — one-line paste (no file)

```powershell
node scripts/issue-invite.mjs --paste "https://your-app.vercel.app|YOUR_SECRET" --label "Google recruiter"
```

Pipe `|` between URL and secret. Copy the **Share link** line from the output.

## Local development

```powershell
npx serve .
```

Gate is **off** unless you set `ACCESS_GATE_ENABLED=true` locally (Vercel CLI required to test middleware).

Preview gate with Vercel CLI:

```powershell
npx vercel dev
```

## Rotate secret

1. Set new `ACCESS_TOKEN_SECRET` on Vercel.
2. Redeploy.
3. All old invite links and sessions invalidate.
4. Issue new invites.

## Git workflow

Work on `feat/showcase-access-gate` → PR → merge to `main` → Vercel production deploy.

Do not push directly to `main`.
