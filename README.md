# Facundo Leis Pou — CV & Portfolio (GitHub Pages)

Merged static résumé + project showcase for dev job applications (primary) and SDR/sales opportunities (secondary).

- **Repository:** [github.com/ezeleis/curriculo](https://github.com/ezeleis/curriculo)
- **Published site:** [ezeleis.github.io/curriculo/](https://ezeleis.github.io/curriculo/)

Supersedes the legacy `curriculo/` folder for new updates.

## Site structure

```text
facundo-leis-resume/
├── index.html              ← CV (profile + language driven)
├── work.html               ← project showcase
├── data/
│   ├── profiles/
│   │   ├── developer.json  ← default: dev-focused CV
│   │   └── sdr.json        ← sales/SDR-oriented CV
│   ├── projects.json       ← work page source of truth
│   └── i18n/
│       ├── en.json         ← UI labels (default)
│       ├── pt-BR.json
│       └── es.json
├── js/site.js              ← switchers + render (no build step)
└── styles.css
```

## Profiles & languages

| Switcher | Default | Options |
|---|---|---|
| Profile | `developer` | `developer`, `sdr` |
| Language | `en` | `en`, `pt-BR`, `es` |

Preferences persist in `localStorage` and URL query params:

- Dev CV in Portuguese: `/?lang=pt-BR`
- SDR CV in Spanish: `/?profile=sdr&lang=es`
- Work page: `/work.html` (inherits lang/profile from URL or storage)

## Local preview

Serve the folder over HTTP (required for JSON fetch):

```bash
npx --yes serve .
```

Then open `http://localhost:3000` (or the port shown).

## GitHub Pages

Configured for **Deploy from a branch** → `main` → `/ (root)`. Push updates to refresh the live site within a few minutes.

## PDF for applications

- **Latest export:** `Facundo_Leis_Pou_Resume_export.pdf` — the **Download PDF** button saves it as `Facundo_Leis_Pou_Resume_FullStack.pdf`.
- **Regenerate:** use **Print / Save as PDF** on the developer profile (best ATS layout), or run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\export-pdf.ps1
```

(requires Microsoft Edge).

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
- **UI labels** (nav, buttons, section headings): `data/i18n/*.json`

Each translatable field uses `{ "en": "...", "pt-BR": "...", "es": "..." }`.

## Git workflow

`main` is protected — work on feature branches and merge via PR.

```bash
git checkout -b feat/showcase-<slug>
# … edit, commit …
git push -u origin HEAD
# open PR → review → merge to main (publishes GitHub Pages)
```

Branch naming: `feat/showcase-<slug>`, `fix/showcase-<slug>`, `chore/showcase-<slug>`.

## Deploy / push updates

Merge to `main` via PR to publish. Do not push directly to `main`.

## Project location

Local folder: `C:\Users\Admin\Projects\facundo-leis-resume`.
