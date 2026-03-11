# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev    # Dev server on http://localhost:3000
npm run build  # Production build — run this before pushing to verify no type errors
npm run lint
```

**Important:** Always `rm -rf .next` before running `npm run dev` after a production build. Running both simultaneously corrupts the `.next` cache.

## Deploying

Deployed automatically to Vercel on push to `master`. Before pushing, verify:
1. `npm run build` passes with no type errors
2. Test the deployed Vercel URL after pushing to confirm the deployment succeeded

## Architecture

Next.js 15 App Router, TypeScript, Tailwind CSS.

**Data flow:**
1. `app/page.tsx` — async server component, reads `searchParams.date` (defaults to today in America/Chicago)
2. Fetches schedule + HR leaders in parallel via `lib/mlb.ts`
3. For each valid game (R/S/F/D/L/W types), fetches play-by-play and filters `home_run` events
4. Builds `Map<number, PlayerStat>` keyed by player ID to deduplicate multi-HR games
5. Passes `players` array to `<PlayerGrid>` (client component for sorting) and `<PlayerCard>` (per player)

**Key files:**
- `lib/mlb.ts` — typed fetch wrappers for MLB Stats API (no key required)
- `lib/utils.ts` — `addSuffix`, `formatDisplayDate`, `getTodayChicago`, `playerImageUrl`, `mlbPlayerUrl`
- `app/page.tsx` — data fetching, `getMilestone()`, `HomeRunEvent` / `PlayerStat` interfaces
- `components/PlayerCard.tsx` — card with multi-border system, HR rows, inline stats
- `components/PlayerGrid.tsx` — client sort bar + active legend
- `components/HRTrajectory.tsx` — perspective SVG trajectory visualization
- `components/HRLoadingAnim.tsx` — looping ball animation used in loading state
- `components/DatePicker.tsx` — client date input with prev/next arrows and `useTransition` overlay
- `components/InfoModal.tsx` — "what is this?" modal

**Card border system** (priority order):
- Emerald: milestone HR (records, round numbers, season/postseason debut)
- Red: moonshot 450+ ft
- Yellow: scorcher 110+ mph exit velo
- Purple: multi-HR game
- Blue: clutch captivating index 80+

Cards support up to 3 visible borders via `border` + `ring` + `outline`.

## Commits

Always include this co-author trailer:

```
Co-Authored-By: Blake's Claude Minion <blakes-claude-minion@noreply.local>
```

Before committing, do a staff engineer review: check for correctness, type safety, style consistency, and obvious bugs.
