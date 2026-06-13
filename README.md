# Facundo Leis Pou — CV & Portfolio

Merged static résumé + project showcase for dev job applications (primary) and SDR/sales opportunities (secondary).

- **Repository:** [github.com/ezeleis/curriculo](https://github.com/ezeleis/curriculo)
- **Gated deploy (recommended):** Vercel + invite-only access — see [docs/access-gate.md](docs/access-gate.md)
- **Legacy public URL:** [ezeleis.github.io/curriculo/](https://ezeleis.github.io/curriculo/) — disable GitHub Pages when using the gate

Supersedes the legacy `curriculo/` folder for new updates.

## Site structure

```text
facundo-leis-resume/
├── index.html              ← CV (profile + language driven)
├── work.html               ← project showcase
├── unlock.html             ← invite-only entry (Vercel gate)
├── middleware.js           ← Edge gate (Vercel only)
├── api/unlock.js           ← token exchange → session cookie
├── lib/token.mjs           ← HMAC invite + session tokens
├── data/                   ← CV + projects JSON
├── js/site.js              ← switchers + render (no build step)
├── scripts/issue-invite.mjs← issue share links (run locally)
└── docs/access-gate.md     ← security model + setup
```

## Profiles & languages

| Switcher | Default | Options |
|---|---|---|
| Profile | `developer` | `developer`, `sdr`, `corretor` |
| Language | `en` | `en`, `pt-BR`, `es` |

Preferences persist in `localStorage` and URL query params:

- Dev CV in Portuguese: `/?lang=pt-BR`
- SDR CV in Spanish: `/?profile=sdr&lang=es`
- Real estate CV in Portuguese: `/?profile=corretor&lang=pt-BR`
- Work page: `/work.html` (inherits lang/profile from URL or storage)

## Local preview

Serve the folder over HTTP (required for JSON fetch). Gate is **off** locally:

```bash
npx --yes serve .
```

To test the access gate, use [Vercel CLI](https://vercel.com/docs/cli): `npx vercel dev` with `.env` from `.env.example`.

## Private access (invite links)

GitHub Pages cannot enforce real authentication (static files are public). For invite-only sharing:

1. Deploy on **Vercel** with `ACCESS_GATE_ENABLED=true` and `ACCESS_TOKEN_SECRET` set — full guide in [docs/access-gate.md](docs/access-gate.md).
2. **Disable GitHub Pages** for this repo (or keep only a minimal public stub) so JSON is not world-readable on `github.io`.
3. Issue links locally:

```powershell
$env:ACCESS_TOKEN_SECRET = "same-secret-as-vercel"
$env:SITE_BASE_URL = "https://your-app.vercel.app"
node scripts/issue-invite.mjs --days 7 --label "Recruiter name"
```

Share the printed URL; recipient gets a 24h browser session (configurable).

## GitHub Pages (optional / legacy)

If enabled, publishes static files from `main` with **no gate**. Use only for a public teaser or disable when Vercel gate is active.

## PDF for applications

- **Download PDF** uses the active profile and language, e.g. `exports/Facundo_Leis_Pou_Resume_corretor_pt-BR.pdf`.
- If that file is not in the repo yet, the button falls back to **Print / Save as PDF** for the current view.
- **Regenerate exports** (requires Microsoft Edge):

```powershell
# one profile + language
powershell -ExecutionPolicy Bypass -File .\scripts\export-pdf.ps1 -Profile corretor -Lang pt-BR

# all profiles and languages
powershell -ExecutionPolicy Bypass -File .\scripts\export-pdf.ps1 -All
```

Print CSS hides switchers and navigation chrome.

## Adding or updating a project after a release

Edit `data/projects.json` only — no app repo coupling.

1. Add or update a project object with localized `name`, `tagline`, `description`.
2. Set `demoUrl` when a live preview exists (`null` until then).
3. Set `status`: `live`, `mvp`, or `in_dev`.
4. Set `featured: true` and `order` for CV teaser visibility.
5. Optional: add screenshot under `assets/projects/` and reference in JSON when screenshots are added to the schema.

Example fields:

```json
{
  "id": "framesync",
  "codename": "REAB",
  "featured": true,
  "order": 2,
  "demoUrl": null,
  "status": "in_dev",
  "stack": ["Vanilla JS", "Supabase"],
  "profiles": ["developer"]
}
```

## Editing CV copy

- **Developer profile:** `data/profiles/developer.json`
- **SDR profile:** `data/profiles/sdr.json`
- **Corretor profile:** `data/profiles/corretor.json`
- **UI labels** (nav, buttons, section headings): `data/i18n/*.json`

Each translatable field uses `{ "en": "...", "pt-BR": "...", "es": "..." }`.

## Git workflow

`main` is protected — work on feature branches and merge via PR.

```bash
git checkout -b feat/showcase-<slug>
# … edit, commit …
git push -u origin HEAD
# open PR → review → merge to main (Vercel production deploy)
```

Branch naming: `feat/showcase-<slug>`, `fix/showcase-<slug>`, `chore/showcase-<slug>`.

## Deploy / push updates

Merge to `main` via PR to publish. Do not push directly to `main`.

## Project location

Local folder: `C:\Users\Admin\Projects\facundo-leis-resume`.
