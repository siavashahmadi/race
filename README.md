# RACE — Resume-as-Code Engine

AI-powered resume curation tool. Paste a job description and RACE selects the most relevant bullets and skills from your experience bank to build a tailored, single-page resume. Or skip the AI and build manually.

## How It Works

1. **Paste a job description** — Claude analyzes it and curates your resume from a pre-vetted experience bank
2. **Or click "Build Manually"** — pick your own bullets and skills without using AI tokens
3. **Fine-tune** — toggle bullets on/off, add/remove skills, see a live preview
4. **Export** — download as a PDF

Overflow detection ensures your resume always fits on one page.

## Setup

```bash
npm install
```

Create a `.env.local` file:

```
ANTHROPIC_API_KEY=your-api-key-here
```

## Running

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Customizing Your Data

Replace the JSON files in `src/data/` with your own:

| File | Purpose |
|------|---------|
| `profile.json` | Name, contact info, education |
| `companies.json` | Company names, roles, dates, locations, display order |
| `experience_bank.json` | Achievement bullets with company, category, and priority |
| `skills_bank.json` | Skill categories with items and display bounds |

The app reads everything from these files — no code changes needed.

## Tech Stack

- Next.js (React)
- Anthropic Claude API (resume curation)
- Puppeteer (PDF export)
- Zod (schema validation)
- Tailwind CSS
