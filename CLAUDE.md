# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pip install -r requirements.txt
python app.py          # Dev server on port 5001
```

Deployed to Vercel via `vercel.json` using `@vercel/python`.

## Architecture

Single-file Flask app (`app.py`) with one route (`GET/POST /`).

**Data flow:**
1. On load, defaults to today's date in America/Chicago timezone; POST with `customDate` overrides it
2. Fetches all games for that date via `statsapi.schedule()`
3. For each game, fetches full play-by-play via `statsapi.get("game_playByPlay", ...)`
4. Filters plays where `result.eventType == 'home_run'`, extracts distance/exit velo via regex on the `playEvents` string
5. Deduplicates player lookups — if a batter already appears in `home_runs_by_player`, reuses cached data to skip an API call
6. Uses team logo from `mlb_team_logos` dict as the player image (player image scraping via BeautifulSoup/Google is implemented but commented out due to load time)
7. Fetches season HR leaders via `statsapi.league_leader_data('homeruns', limit=5)`
8. Renders `templates/index.html` with Jinja2

**`home_runs_by_player` structure:** `{ player_name: [(top_bottom, inning_with_suffix, runs_scored, batter_url, batter_image_url, homerun_number, current_team, launchSpeed, distance), ...] }`

**Template:** `templates/index.html` — player cards are clickable (JS sets `data-url` to MLB search URL). Styling in `static/styles.css`.

**Known issue:** When a batter already exists in `home_runs_by_player`, the code mistakenly reads `home_runs_by_player[batter][0]` (a tuple) for `current_team`, `batter_url`, and `batter_image_url` instead of the correct indexed fields.
