# Orchestration State

This file is the source of truth for all orchestrated development tasks. The Mayor updates it before spawning workers. Workers update it when tasks complete or block. Always commit changes to master.

## How It Works

1. Tell the Mayor (Claude) what feature you want
2. Mayor decomposes it into tasks, writes them here, spawns parallel worker agents
3. Each worker implements in an isolated git worktree → quality gate → PR
4. Mayor reports PR links when done
5. Review and merge (or just merge)

See `.claude/prompts/mayor.md` and `.claude/prompts/worker.md` for full orchestration logic.

---

## Active Tasks

| ID | Title | Status | Branch | PR | Depends On | Description |
|----|-------|--------|--------|----|------------|-------------|
| T010 | HR permalink + share button | in_progress | feat/T010-hr-permalink | — | — | Add a shareable permalink for each individual home run so friends can share and talk trash. (1) Add `playId: string` to the `HomeRunEvent` interface in app/page.tsx — extract it from `play.playId` in the play-by-play loop (also add `playId: string` to the Play type in lib/mlb.ts). (2) Create `app/hr/[date]/[gamePk]/[playId]/page.tsx` — server component that fetches the game play-by-play, finds the matching play, renders full HR details: player name, team, date, distance, exit velo, launch angle, pitch type, inning, venue, trajectory visualization. Also show the pitcher who gave up the HR (pitcher name from play.matchup.pitcher — add `pitcher: { fullName: string; id: number }` to the Play matchup type). (3) Create `app/hr/[date]/[gamePk]/[playId]/opengraph-image.tsx` — ImageResponse 1200x630, dark zinc (#09090b) background. Show: player name large and bold, team name, distance as a huge number with "ft" label, exit velo with "mph", AND the trajectory arc as inline SVG (simplified version of HRTrajectory — a curved path showing ball flight, with distance labeled at peak). Also show "off [Pitcher Name]" in small text — this is the trash-talk element. Edge runtime, inline styles only. (4) Add `components/HRShareButton.tsx` — tiny "use client" component with a share icon. On click: calls `navigator.share({ url, title })` on mobile (iOS share sheet), falls back to `navigator.clipboard.writeText(url)` on desktop with a brief "copied!" tooltip. (5) Render `<HRShareButton>` on each HR row in `components/PlayerCard.tsx` passing the `/hr/DATE/GAMEPK/PLAYID` URL and title like "Aaron Judge just went yard — 450ft off Cole". Button is subtle: small icon, zinc-600, shows on hover. Note: PlayerCard is a server component so HRShareButton must be a separate client component. Screenshot route: `/?date=2024-08-15` — main page showing HR cards with share buttons visible. |
| T005 | Footer disclaimer | merged | feat/T005-disclaimer | https://github.com/blakemartinez/who-hit-a-homerun-today/pull/7 | — | Add "not affiliated with MLB or any team" to the footer in app/page.tsx. The footer already has "data via MLB Stats API". Add a new line below it: "not affiliated with MLB, its clubs, or any official entity." Keep the same zinc-700 text-xs style. One line change. |
| T006 | Tomorrow DFS HR threats | merged | feat/T006-dfs-preview | https://github.com/blakemartinez/who-hit-a-homerun-today/pull/9 | — | When the user navigates to a future date (date > getTodayChicago()), instead of the empty state show a "tomorrow's HR threats" preview. Add a new lib function `getScheduleWithProbables(date)` to lib/mlb.ts that calls `/api/v1/schedule?sportId=1&date=DATE&hydrate=team,venue,probablePitcher` and returns games with probable pitcher names. Add a second lib function `getHRLeadersWithTeam(season, limit=50)` that calls `/api/v1/stats/leaders?leaderCategories=homeRuns&season=SEASON&limit=50&sportId=1` — extend the existing HRLeader type to include `team.id`. In app/page.tsx: detect if date > getTodayChicago(). If so, fetch both: (1) schedule with probables, (2) season HR leaders top 50. Cross-reference: for each HR leader, check if their team.id matches any team in tomorrow's schedule. Build a list of HRThreat objects: { playerName, teamName, seasonHRs, opponentTeam, isHome, venueName, probablePitcherName }. Sort by seasonHRs descending, take top 12. Create a new component `components/HRThreatsList.tsx` (client, no hooks needed) that renders: a header "tomorrow's HR threats", a subtle disclaimer "based on season HR totals · not a guarantee", and a table/list showing each threat: player name, team, season HRs, matchup (vs opponent, home/away), venue, probable pitcher. Use dark zinc styling consistent with the rest of the app. In app/page.tsx, render `<HRThreatsList threats={threats} date={date} />` instead of `<EmptyState>` when the date is in the future and threats.length > 0. Screenshot route: `/?date=TOMORROW` where TOMORROW is one day after today's date. |
| T007 | Player page OG image | merged | feat/T007-og-image | https://github.com/blakemartinez/who-hit-a-homerun-today/pull/6 | — | Add a dynamic Open Graph image to the player detail page so sharing `/player/592450` on iMessage or social shows a proper preview card instead of a blank URL. Create `app/player/[id]/opengraph-image.tsx` using Next.js `ImageResponse` from `next/og`. The image should be 1200x630px with a dark zinc (#09090b) background. Show: player full name (large, white), team name (medium, zinc-400), and if stats are available: season HRs as a big number with "HR" label, plus avg and OPS. Use inline styles (not Tailwind — ImageResponse requires inline styles). Fetch data by calling `getPlayerInfo(id)` and `getSeasonStats(id)` from lib/mlb.ts. The `id` param comes from the route segment. Export `export const runtime = "edge"` for fast generation. Also add a matching `generateImageMetadata` or just rely on Next.js auto-detection of `opengraph-image.tsx`. Additionally, update the `generateMetadata` in `app/player/[id]/page.tsx` to add `openGraph.images` pointing to the generated image URL. Screenshot route: `/player/592450` — the player page itself (the OG image is only visible when the URL is shared externally, but the player page confirms the feature is live). |
| T008 | HR reaction tags | merged | feat/T008-reaction-tags | https://github.com/blakemartinez/who-hit-a-homerun-today/pull/8 | — | Add small reaction tag badges to individual HR rows in the PlayerCard component. Each HR event can earn one or more tags based on its stats. Compute tags from the existing HomeRunEvent fields. Tag rules (in priority order, show max 2 per HR): "grand slam" if runsScored === "Grand Slam"; "moonshot" if distance >= 450; "no-doubter" if exitVelo >= 108 && distance >= 430; "scorcher" if exitVelo >= 112; "clutch" if captivatingIndex >= 80; "cheapie" if distance !== null && distance < 360; "silencer" (road HR, i.e. topBottom === "Top" && captivatingIndex >= 60). Tags should render as small inline badges on the HR stat row in `components/PlayerCard.tsx`. Style: `text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700` — subtle, not loud. Place them after the distance/exit velo stats on the HR row. Do not show tags if no stats are available for that HR. Screenshot route: `/` — main page showing player cards with tagged HRs. If today has no HRs use `/?date=2024-08-15` as fallback (that date has good data). |

---

## Backlog

| ID | Title | Description |
|----|-------|-------------|
| T009 | Daily HR Challenge (game revamp) | Revamp /game into a Wordle-style daily challenge. One HR per day (everyone gets the same one — pick the most interesting HR of the day by highest exit velo). Show cold stats only: exit velo, distance, launch angle, pitch type, inning, score context, venue. 3 guesses to name the player from a searchable list of all active MLB players. After each wrong guess reveal one hint: (1) team, (2) position + bats side. Show result as shareable emoji grid: ⬜⬜🟩. Keep the trajectory graphic visible during guessing — the shape is part of the fun. Fix the number/label overlap issue in HRTrajectory.tsx when rendered in a small game card context: reduce font sizes, add text shadows or background pills behind numbers, or offset labels so they don't collide with the arc. The fix should look clean at the game card size (~400px wide). The "daily" is keyed to today's date in Chicago time (getTodayChicago()) — same HR for everyone that day. Persist guess state in localStorage keyed by date so refreshing doesn't reset. Depends on T010 (needs playId on HomeRunEvent). Depends on T010. |

---

## Completed

| ID | Title | PR | Merged |
|----|-------|----|--------|
| T001 | Season team on player page | https://github.com/blakemartinez/who-hit-a-homerun-today/pull/2 | ✅ |
| T002 | SEO improvements | https://github.com/blakemartinez/who-hit-a-homerun-today/pull/3 | ✅ |
| T003 | Update InfoModal | https://github.com/blakemartinez/who-hit-a-homerun-today/pull/4 | ✅ |
| T004 | Guess Who Hit It game | https://github.com/blakemartinez/who-hit-a-homerun-today/pull/5 | ✅ |

---

## Session Log

| Date | Feature | Tasks | Outcome |
|------|---------|-------|---------|
| 2026-03-17 | Player team fix, SEO, InfoModal update, Guess game | T001–T004 | All merged |
| 2026-03-18 | Disclaimer, DFS preview, OG image, reaction tags | T005–T008 | In progress |
