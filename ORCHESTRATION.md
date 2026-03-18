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
| — | — | — | — | — | — | No active tasks |

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
| — | — | — | — |
