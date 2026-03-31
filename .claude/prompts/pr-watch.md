# PR Watch — Monitor open PRs for new comments

Check for new unaddressed comments on open PRs that were created by the orchestration system.

## Step 1: Find open PRs with the `pr-ready` label or created by the minion system

```bash
gh pr list --repo blakemartinez/who-hit-a-homerun-today --state open --json number,title,headRefName,comments,labels --jq '.'
```

## Step 2: For each open PR, check for new comments

```bash
gh api repos/blakemartinez/who-hit-a-homerun-today/issues/<PR_NUMBER>/comments --jq '.[] | {id, user: .user.login, created_at, body}' | tail -20
```

Look for comments that:
- Are from `blakemartinez` (Blake — the repo owner) and have NOT been replied to by a minion
- Are from the original issue author and have NOT been replied to
- Are NOT from `github-actions[bot]` or minion comments (those contain "🤖")

## Step 3: Respond to comments

**If Blake left a comment requesting a fix:**
1. Read the PR diff to understand the current code
2. Check out the PR branch in the worktree
3. Make the requested fix
4. Run quality gate: `npx tsc --noEmit` + `npm run lint`
5. Commit and push
6. Reply to Blake's comment confirming the fix:
   ```bash
   gh pr comment <PR_NUMBER> --body "Fixed in <commit>. <brief description of what changed>.

   🤖 Fix by Issue Mayor Minion"
   ```

**If Blake left a comment asking a question:**
1. Read the relevant code to answer accurately
2. Reply with a clear, concise answer

**If the issue author left a comment:**
1. If it's a question about the implementation: answer it
2. If it's a feature request or change: note it and tell them Blake will decide
3. If it's a bug report: investigate, fix if straightforward, or note for Blake

**If Blake approved/merged:** No action needed, the normal flow handles cleanup.

## Step 4: Report

If there were no new comments to address, say "No new PR comments to address."

If comments were addressed, briefly report what you did.
