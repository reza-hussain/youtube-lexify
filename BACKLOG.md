# Backlog

Working queue for the autonomous dev loop (see `CLAUDE.md` → "Autonomous dev loop" for the rules it follows).

Add items anywhere in the unchecked list — the loop picks the top unchecked item on its next wake. Reorder to reprioritize. Checked items are done; leave a one-line note if a decision was made along the way.

## Housekeeping (seeded from repo state on 2026-09-06)

- [x] Add build artifacts (`*.zip`) to `.gitignore` so packaged extension zips stop showing up as untracked
- [x] Decide what to do with the two pending uncommitted changes — both were legitimate, verified with `tsc --noEmit` (clean), committed separately: `515c2dd` (env URL fix) and `8155594` (Prettier reformat, confirmed no logic change)
- [x] `logo.png` at repo root removed — it was byte-identical to the already-tracked `apps/lexify-ext/public/logo.png` and `apps/lexify-web/public/logo.png`, just a leftover source copy

## Open items

_(none yet — add real priorities here; the loop will otherwise idle on housekeeping only)_
