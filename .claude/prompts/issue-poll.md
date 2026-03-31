# Issue Poll — Check for new GitHub issues to orchestrate

Check for GitHub issues labeled `claude` that haven't been processed yet.

```bash
gh issue list --label "minion" --state open --json number,title,body,labels,author --jq '.[] | select(.labels | map(.name) | index("in-progress") | not)'
```

If there are results:
1. Label the issue `in-progress` so we don't pick it up again:
   ```bash
   gh issue edit <NUMBER> --add-label "in-progress"
   ```
2. Read `.claude/prompts/issue-mayor.md` for full instructions
3. Execute the full issue-mayor workflow for the issue: triage → plan → implement → PR → review
4. When done, remove the `claude` label and add `pr-ready`:
   ```bash
   gh issue edit <NUMBER> --remove-label "minion" --remove-label "in-progress" --add-label "pr-ready"
   ```

If there are no results, do nothing — just report "No new issues to process."
