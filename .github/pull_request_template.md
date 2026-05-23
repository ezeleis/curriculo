## Scope
- What changed?
- Why?

## Validation (static site)
- [ ] Served locally (`npx serve .`) — CV and work page load
- [ ] Profile switcher works (`developer`, `sdr`)
- [ ] Language switcher works (`en`, `pt-BR`, `es`)
- [ ] `data/projects.json` valid JSON; demo URLs correct
- [ ] Print / Save as PDF acceptable on developer + en
- [ ] No secrets added or exposed
- [ ] No auth / billing / DNS / GitHub Pages settings change unless intended

## Risk
- Risk level: low / medium / high
- Rollback path: revert merge on `main` (GitHub Pages republishes from previous commit)
