# Mobile Responsive Layout — Build Screen

## Overview
The build screen (post-analysis) currently uses a side-by-side layout that breaks on screens < 1024px. This spec defines a tab-based mobile layout that provides full functionality on smaller screens.

## Breakpoint
- `< 1024px` (Tailwind `lg`): mobile tab layout
- `>= 1024px`: current desktop side-by-side layout (unchanged)

## Mobile Layout

### Tab Bar
- Two tabs: **Edit** | **Preview**
- Positioned directly below the header
- Active tab has a visible indicator (underline or filled background)
- Default to Edit tab on initial load

### Edit Tab
Full-width scrollable column containing (in order):
1. AI Reasoning (collapsible, same as desktop)
2. Experience Bullets (toggle list grouped by company)
3. Skills (category checkboxes + item toggles)

### Preview Tab
- ResumePreview component scaled to fit the screen width
- Scale factor: `screenWidth / 816px` (816px = 8.5in at 96dpi), capped at 1.0
- Inline editing remains functional (tap to edit text, labels, skills)
- Overflow red border still visible when applicable

### Sticky Bottom Bar (both tabs)
- Fixed to bottom of viewport
- Contains: Download PDF button + Start Over button side by side
- Overflow warning text displayed above the buttons when triggered
- White background with top border for visual separation

## Scope

### Changes
- `src/components/AppShell.tsx` — conditional layout based on screen width, tab state, sticky bar

### No Changes
- First screen (JD input + Build Manually) — already mobile-friendly
- Header — stays as-is
- Desktop layout (>= 1024px) — completely untouched
- ResumePreview, BulletToggle, SkillsEditor — no component changes needed
- API routes, data files, types — untouched

## Implementation Notes
- Use Tailwind responsive classes (`lg:` prefix) to toggle between layouts
- Tab state is local (`useState`), no URL/routing needed
- The preview scale can use CSS `transform: scale()` with `transformOrigin: top left`, wrapped in a container sized to the scaled dimensions (same pattern as desktop)
- The sticky bar replaces the current Actions card on mobile; on desktop the Actions card renders as before
