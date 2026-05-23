## Scope
- What changed?
- Why?

## Validation (static site)
- [ ] Served locally (`npx serve .`) — CV and work page load
- [ ] Profile switcher works (`developer`, `sdr`)
- [ ] Language switcher works (`en`, `pt-BR`, `es`)
- [ ] `data/projects.json` valid JSON; demo URLs correct
- [ ] Print / Save as PDF acceptable on developer + en
- [ ] No secrets added or exposed (no `.env`, no `ACCESS_TOKEN_SECRET` in repo)
- [ ] No auth / billing / DNS / hosting settings change unless intended

## Validation (access gate — if this PR touches gate)
- [ ] `vercel dev` — unauthenticated `/` redirects to `/unlock.html`
- [ ] Valid invite link unlocks and sets session; `/data/*` blocked without cookie
- [ ] Expired / tampered token rejected
- [ ] GitHub Pages disabled or documented if full site must stay private

## Risk
- Risk level: low / medium / high
- Rollback path: revert merge on `main` (GitHub Pages republishes from previous commit)
