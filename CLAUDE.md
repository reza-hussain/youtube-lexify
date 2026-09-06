# youtube-lexify

Monorepo (turbo + bun/npm workspaces): Chrome extension (`apps/lexify-ext`), Next.js dashboard
(`apps/lexify-web`), NestJS API (`apps/lexify-api`). See `instructions.md` and
`admin-guidelines.md` for the original product/feature specs.

## Autonomous dev loop

This repo is worked on by a self-pacing `/loop` that pulls tasks from `BACKLOG.md`. Rules for
that loop (and for any other autonomous/background run in this repo):

- **Source of truth**: `BACKLOG.md`. Take the top unchecked item, do it, check it off with a
  short note on what was actually done (or why it was skipped), move to the next.
- **Small, real commits**: one logical change per commit, written the way the existing git log
  reads (short imperative subject, no fluff). Never bundle an unrelated fix into a backlog-item
  commit.
- **Never commit secrets**: don't add real API keys/tokens to any tracked file. `.env*` changes
  are fine to commit (they already are tracked here) but read the diff first — if a value looks
  like a live secret rather than a URL/flag, stop and leave it for the user instead of committing.
- **Verify before committing**: run the relevant `turbo run build` / `lint` / `test` (or the
  specific app's script) for whatever you touched. Don't commit code that doesn't build.
- **No force-push, no history rewrites, no `git reset --hard`** ever, without the user asking
  directly in that session.
- **Pushing**: `git push` is allowed (see `.claude/settings.local.json`), but only after a commit
  actually builds/lints clean.
- **When blocked or ambiguous** (task needs a product decision, credentials, or touches
  billing/auth in a way that's easy to get wrong): leave the backlog item unchecked, add a note
  explaining the blocker directly under it, and move to the next item rather than guessing.
- **If the backlog has nothing actionable left**, stop looping (long idle wakeup) rather than
  inventing busywork — note that in the loop's status rather than silently going quiet.
