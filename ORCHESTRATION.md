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
| T001 | Season team on player page | in_progress | feat/T001-season-team | — | — | Show the team the player was on during the selected season, not always their current team |
| T002 | SEO improvements | in_progress | feat/T002-seo | — | — | Date-specific page titles, richer player page metadata, JSON-LD on player pages |
| T003 | Update InfoModal | in_progress | feat/T003-info-modal | — | — | Update "what is this?" copy to cover WBC mode, pitch zone map, pitch type breakdown |
| T004 | Guess Who Hit It game | in_progress | feat/T004-guess-game | — | — | New /game page: show HR stats (no name), pick which player hit it from 4 options |

---

## Backlog

| ID | Title | Description |
|----|-------|-------------|
| — | — | No backlog items |

---

## Completed

| ID | Title | PR | Merged |
|----|-------|----|--------|
| — | — | — | — |

---

## Session Log

| Date | Feature | Tasks | Outcome |
|------|---------|-------|---------|
| 2026-03-17 | Player team fix, SEO, InfoModal update, Guess game | T001–T004 | in progress |
