# RACE -- Resume-as-Code Engine

A resume curation tool that selects your most relevant experience for a given job description -- it doesn't write anything new, it picks from what you've already vetted.

## Why I Built This

Every time I applied somewhere, I'd spend 30 minutes shuffling bullets around in a Google Doc, trying to figure out which combination of experience best matched the role. I wanted a system that would do that curation step for me: take a job description, look at my full experience bank, and surface the strongest subset. The key constraint was that it should never generate text -- only select from pre-written, pre-approved bullets. That way I stay in control of what my resume actually says.

## How It Works

1. **Paste a job description** -- Claude reads it and picks the most relevant bullets and skills from your experience bank
2. **Or go manual** -- click "Build Manually" to skip AI and choose everything yourself
3. **Fine-tune** -- toggle individual bullets on/off, adjust skill categories, watch the live preview update
4. **Export** -- download a pixel-perfect PDF that matches exactly what you see on screen

The UI enforces a single-page constraint throughout. If your selections overflow the page, the preview shows a red ring and the export button disables.

## Architecture Overview

```
                         Server (page.tsx)
                              |
              loads JSON data at build/request time
                              |
                              v
                +--------------------------+
                |   AppShell (client)      |
                |   manages all UI state   |
                |                          |
                |  Phase 1: JD input       |
                |  Phase 2: edit + preview |
                +--------------------------+
                   /          |          \
                  v           v           v
           POST /analyze  POST /export  GET /print-data/[id]
           (Claude API)   (Puppeteer)   (in-memory cache)
                  \           |           /
                   v          v          v
              JD --> bullet IDs --> preview --> PDF
```

Data flows in one direction: the server component reads JSON files and passes them as props to the client shell. From there, everything is client-side state. The API routes are stateless except for a short-lived cache that bridges PDF generation.

## Data Layer

There's no database. The entire resume lives in four JSON files under `src/data/`:

- **profile.json** -- name, contact info, education
- **companies.json** -- company names, roles, dates, locations, display order
- **experience_bank.json** -- every bullet you might put on a resume, tagged with company, categories, priority (1-3), and a pre-calculated character count
- **skills_bank.json** -- skill categories with items and min/max display bounds

The reason I went with flat JSON instead of a database is that this is a single-user tool. JSON files are version-controllable, trivially portable, and I can edit them in any text editor. The trade-off is obvious -- this won't scale to multi-user -- but that's fine, it doesn't need to.

**Zod as the single source of truth.** The schemas in `src/lib/schemas.ts` define the shape of all data, and I use them for both runtime validation (`.safeParse()` in API routes) and TypeScript type inference. This means the types can't drift from the validation logic -- they're derived from the same Zod definitions.

Companies drive everything. The `order` field in `companies.json` (1 = most recent) determines how bullets are grouped and how the fallback logic allocates space when AI curation fails.

## AI Integration

Claude acts as a curator, not a writer. The `/api/analyze` route sends the job description along with bullet *metadata* only -- id, company, categories, label, priority, and character count. The actual bullet text stays on the client. This keeps the token count low and focuses Claude on selection rather than generation.

Key implementation details:

- **Forced tool use** -- `tool_choice: { type: "tool", name: "curate_resume" }` guarantees Claude returns structured data (selected bullet IDs + curated skills) instead of prose. No parsing needed.
- **Low temperature (0.3)** -- I want consistent, predictable selections. Creative writing isn't the goal here.
- **Model** -- configurable via `ANTHROPIC_MODEL` env var (defaults to `claude-sonnet-4-20250514`)
- **Token budget** -- 2048 max tokens, which is plenty for returning a list of IDs and skill arrays
- **Character-aware prompting** -- the system prompt tells Claude that ~90-100 chars is roughly one resume line and ~300 chars is about three lines, so it can reason about page space

**Fallback logic.** If Claude returns bullet IDs that don't exist in the experience bank (or the API call fails), the system falls back to priority-based selection: it takes the top-priority bullets from each company in recency order with default counts of [5, 4, 1], paired with a `getDefaultSkills()` call. The resume always renders something usable.

## PDF Pipeline

The PDF export uses Puppeteer to print the resume page, not an HTML-to-PDF library. The reason is fidelity -- I need the PDF to look exactly like the browser render, with the right fonts, spacing, and layout. Libraries that parse HTML independently always have subtle differences.

The flow works like this:

1. Client POSTs selected bullet IDs and skills to `/api/export`
2. The route generates a UUID, caches the resume state in memory with a **60-second TTL**, then launches Puppeteer
3. Puppeteer opens `/print?id={uuid}`, which fetches the cached state from `/api/print-data/[id]`
4. It waits for `networkidle0` (15s timeout) and `document.fonts.ready`, then prints to PDF
5. The PDF is returned as the response; the cache entry auto-deletes after 60 seconds

**Singleton browser.** Launching a Chromium instance is expensive, so the app keeps one alive for the process lifetime. In dev mode it's stored on `globalThis.__browser` to survive hot reloads; in production it's on `globalThis.__prodBrowser`. Graceful shutdown handlers clean up on exit/SIGINT/SIGTERM.

The in-memory cache is intentionally short-lived. It exists only to bridge the gap between "the API route knows the resume state" and "the print page needs to render it." A Map with `setTimeout`-based deletion is the simplest thing that works.

## Overflow Detection

The resume preview uses a DOM-based approach to detect when content exceeds a single page:

- A `useEffect` hook compares `ref.current.scrollHeight` against **1056px** (11 inches at 96 DPI -- standard US Letter height)
- This check runs every time `selectedBullets` or `curatedSkills` change
- If content overflows, the callback fires `onOverflow(true)` up to AppShell, which shows a red border on the preview and disables the export button

The `charCount` field on each bullet enables quick space estimation during curation (both by Claude and by the fallback logic), but the actual overflow check is always DOM-measured. No estimation can replace measuring the real rendered output.

## Setup

```bash
npm install
```

Create `.env.local`:

```
ANTHROPIC_API_KEY=your-api-key-here
ANTHROPIC_MODEL=claude-sonnet-4-20250514  # optional, this is the default
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Customizing Your Data

Swap the JSON files in `src/data/` with your own information:

| File | What it controls |
|------|-----------------|
| `profile.json` | Name, phone, email, LinkedIn URL, education |
| `companies.json` | Company names, job titles, date ranges, locations, display order |
| `experience_bank.json` | All resume bullets -- each tagged with company, categories, priority, and character count |
| `skills_bank.json` | Skill groupings with per-category min/max display limits |

No code changes needed. The Zod schemas will validate your data at runtime and surface clear errors if something doesn't match the expected shape.

## Tech Stack

- Next.js 16 (React 19)
- Anthropic Claude API (`@anthropic-ai/sdk` ^0.78.0)
- Puppeteer ^24.39.1
- Zod ^4.3.6
- Tailwind CSS 4
