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

**When `npm run dev` is running in the background:** Do NOT run `npm run build` — it will corrupt the `.next` cache and require killing dev + `rm -rf .next` to recover. Instead:
- Type-check only: `npx tsc --noEmit` (safe, doesn't touch `.next`)
- Lint only: `npm run lint`
- For a full build check, stop the background dev task first, then `rm -rf .next && npm run build`, then restart dev.

## Deploying

Vercel is connected to the repo and auto-deploys on push to `master` — no manual deploy needed.

**Before committing and pushing:**
1. Stop the background dev task if running
2. `rm -rf .next && npm run build` — must pass with no type errors
3. `vercel build` — verify the Vercel build also passes locally
4. Once both pass, commit and push; Vercel handles the rest automatically

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

## Orchestration

This project uses a lightweight Gastown-inspired multi-agent orchestration system.

**To use it:** Describe a feature. Claude acts as Mayor Minion — it plans, spawns parallel Worker Minions in isolated git worktrees, then Blake Review Minions approve+merge or request changes.

**Key files:**
- `ORCHESTRATION.md` — living task state (source of truth); always committed to master
- `.claude/prompts/mayor.md` — Mayor Minion planning logic
- `.claude/prompts/worker.md` — Worker Minion instructions
- `.claude/prompts/reviewer.md` — Blake Review Minion instructions

**Minion roles:**
- **Mayor Minion** — orchestrates, decomposes features, spawns workers and reviewers
- **Worker Minion** — implements tasks in isolated worktrees, creates PRs with screenshots
- **Blake Review Minion** — reviews code diff + screenshot, approves+merges or requests changes

**Task lifecycle:** `todo` → `in_progress` → `done` → `merged`

**Quality gate:** Every Worker Minion must pass `npx tsc --noEmit` + `npm run lint` before creating a PR. No exceptions.

**Worker Minions never push to master** — only feature branches via PRs. Blake Review Minion handles the merge.

### Issue-Driven Automation

Issues labeled `minion` are picked up by a polling loop (`/loop 5m /issue-poll`) that runs in the active Claude Code session.

**Flow:** Label issue `minion` → loop picks it up → Issue Mayor triages → plans tasks → Worker Minions implement → Issue Reviewer comments on PR → Blake merges.

**Key difference from interactive orchestration:** Issue-driven PRs are **never auto-merged**. Blake reviews and merges them himself.

**Key files:**
- `.claude/prompts/issue-mayor.md` — Issue-specific mayor (triage step, links issues in PRs)
- `.claude/prompts/issue-reviewer.md` — Reviewer that comments but does NOT merge
- `.claude/prompts/issue-poll.md` — Polling logic (check for `minion`-labeled issues)

**Label lifecycle:** `minion` → `in-progress` (being worked) → `pr-ready` (PR created, awaiting Blake's merge)

**PR comment monitoring:** A second loop (`/loop 5m pr-watch`) monitors open PRs for new comments from Blake or issue authors. If Blake requests a fix, the mayor auto-fixes and replies. If someone asks a question, it answers. See `.claude/prompts/pr-watch.md`.
## Commits

Always include this co-author trailer:

```
Co-Authored-By: Blake's Claude Minion <blakes-claude-minion@noreply.local>
```

Before committing, do a staff engineer review: check for correctness, type safety, style consistency, and obvious bugs.
