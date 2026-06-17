# Profile Tokens — Quick Start

Copy-paste commands for common scenarios. **Always set your secret first:**

```bash
export ACCESS_TOKEN_SECRET="af909c259dfc98b4ecdc73c661a541370345855c2877a97fd217ae558eb2cfe4"
```

## 5-Second Recipes

### Generic 7-day link (all profiles)
```bash
node scripts/issue-invite.mjs --days 7 --label "My Recipient Name"
```

### SDR profile, Portuguese only (1 week)
```bash
node scripts/issue-invite.mjs --days 7 --label "SDR Sales" --profiles sdr pt-BR
```

### Developer profile, English only (1 week)
```bash
node scripts/issue-invite.mjs --days 7 --label "Tech Recruiter" --profiles developer en
```

### Real Estate Broker, all languages (2 weeks)
```bash
node scripts/issue-invite.mjs --days 14 --label "Broker Partner" --profiles corretor pt-BR en es
```

### SDR in Portuguese + Developer in English (1 week)
```bash
node scripts/issue-invite.mjs --days 7 --label "Mixed Audience" --profiles sdr pt-BR developer en
```

### Same profile, multiple languages (1 week)
```bash
node scripts/issue-invite.mjs --days 7 --label "Developer All Langs" --profiles developer pt-BR en es
```

### Limited access (1 day demo)
```bash
node scripts/issue-invite.mjs --days 1 --label "Demo"
```

### Extended access (30 days)
```bash
node scripts/issue-invite.mjs --days 30 --label "Long-term Partner"
```

## Profile/Language Codes

**Profiles:**
- `sdr` — Sales Development Representative
- `developer` — Software Developer
- `corretor` — Real Estate Broker

**Languages:**
- `pt-BR` — Portuguese (Brazil)
- `en` — English
- `es` — Spanish

## What Recipients See

With token `--profiles sdr pt-BR`:
- ✅ Only SDR profile shown in dropdown
- ✅ Only Portuguese shown in language dropdown
- ✅ All content filtered to SDR profile
- ❌ Cannot access Developer or Corretor
- ❌ Cannot switch to English or Spanish

With token `--profiles developer` (no languages specified):
- ✅ Only Developer profile shown
- ✅ All 3 languages available
- ✅ Can switch between PT-BR, EN, ES
- ❌ Cannot access SDR or Corretor

With token (no `--profiles` flag):
- ✅ All 3 profiles available
- ✅ All 3 languages available
- ✅ Full unrestricted access

## After Running

The script outputs:
1. **Share link** — Copy this entire URL, send to recipient
2. **Raw token** — Only needed if they paste it manually

Recipients click the link or paste the token → they're authenticated for 24 hours → dropdowns show only their allowed options.

## Common Scenarios

**You:** "I'm interviewing at a tech company"
```bash
node scripts/issue-invite.mjs --days 7 --label "Tech Interview Recruiter" --profiles developer en
```

**You:** "I'm meeting a real estate client"
```bash
node scripts/issue-invite.mjs --days 14 --label "Real Estate Client" --profiles corretor pt-BR
```

**You:** "I'm in sales, want to show my work in Portuguese"
```bash
node scripts/issue-invite.mjs --days 7 --label "Sales Prospect" --profiles sdr pt-BR
```

**You:** "I'm testing the system"
```bash
node scripts/issue-invite.mjs --days 1 --label "Test"
```

**You:** "I'm giving a demo to multiple people"
```bash
node scripts/issue-invite.mjs --days 3 --label "Company Demo - Full Access"
# No --profiles = everyone sees everything
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "ACCESS_TOKEN_SECRET not set" | Run `export ACCESS_TOKEN_SECRET="..."` first |
| "must be at least 32 characters" | Make sure secret is actually long enough |
| "--days must be between 1 and 90" | Use 1-90, not "next week" or "1 month" |
| Recipient can't see restricted profile | Verify the `--profiles` flag was in the command |
| Link doesn't work on site | Check `ACCESS_GATE_ENABLED=true` on Vercel |

## Need More?

Full docs: See `PROFILE_TOKENS.md`
