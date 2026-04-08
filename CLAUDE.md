# RACE — Claude Code Instructions

## Two-Remote Git Setup

This repo has two remotes:

| Remote | URL | Purpose |
|--------|-----|---------|
| `origin` | github.com/siavashahmadi/race | Public template repo — demo data only |
| `private` | github.com/siavashahmadi/race-personal | Private repo — contains real personal data |

**Rules:**
- `git push origin main` — UI/feature changes only. Never push personal data files here.
- `git push private main` — everything, including personal data. Always push here after any change.
- Personal data files: `src/data/profile.json`, `src/data/companies.json`, `src/data/experience_bank.json`, `src/data/skills_bank.json`

## Commit Messages

No mentions of AI, Claude, or AI tooling in commit messages or code comments.
