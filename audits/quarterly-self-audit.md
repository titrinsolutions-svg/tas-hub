# TAS Quarterly Self-Audit

A deep system audit modeled on `C:\Users\Tish\Desktop\TITRIN\Claude\SYSTEM-AUDIT-2026-05-20.md`. Goes further than the weekly check: cross-reference integrity, drift indicators, architectural coherence, self-improvement opportunities, and open-items rollup from prior audits.

## Paths
- **tas-hub repo:** `C:\Users\Tish\Downloads\tas-hub`
- **TITRIN brain:** `C:\Users\Tish\Desktop\TITRIN`
- **Output file:** `C:\Users\Tish\Desktop\TITRIN\Claude\SYSTEM-AUDIT-YYYY-MM-DD.md` (today's date)

## Scope (run in order)

### Phase 1 — Baseline: run the system health script
Execute `C:/Users/Tish/Desktop/TITRIN/Claude/TAS - Tools/system_health.py` to capture the baseline of mechanical checks (git/backup/settings/verifiers/learning loops/deploy match). Capture its output for the quarterly audit's baseline section. This is the same fast check that runs on every session start, but here you're snapshotting it as part of the deeper quarterly review.

Additionally: run `npx tsc --noEmit` and `npm run build` in `C:/Users/Tish/Downloads/tas-hub` (these aren't in the session-start script because they're too slow for every-session use — but they belong in the quarterly).

### Phase 2 — Cross-reference integrity (dispatch a subagent)

Dispatch an Explore-type subagent with this prompt:

> Audit the TITRIN brain at `C:\Users\Tish\Desktop\TITRIN` for cross-reference integrity. Read-only. Verify:
>
> 1. Every file path referenced in `CLAUDE.md` exists
> 2. Every file path referenced in `Claude/ARCHITECTURE.md` exists
> 3. Every memory file referenced in `Claude/memory/MEMORY.md` exists (if such a file exists at that path)
> 4. Every scheduled task listed in `Claude/ARCHITECTURE.md` Layer 4 table matches an actual folder in `Claude/Scheduled/`
> 5. Every tool listed in Layer 5 exists in `Claude/TAS - Tools/`
> 6. Hooks in `.claude/settings.json` reference scripts that exist
> 7. Look for STALE references: V1 Cloudflare URLs, retired endpoints, files moved to `_archive/`, deprecated tasks, deadlines that have passed
> 8. Compare ARCHITECTURE.md's tool/automation list against actual filesystem state — flag mismatches
>
> Report in 3 tiers (🟢 clean / 🟡 minor drift / 🔴 real problems), under 600 words total. Don't fix anything.

### Phase 3 — Drift indicators
- Search `Claude/memory/` for mentions of any tool/file moved to `_archive/` (use grep). Flag each as stale documentation.
- Check the "Items Needing Attention" block in `CLAUDE.md`: are the listed hard deadlines still in the future? Flag any that have passed.
- Read `Claude/memory/projects/active-projects.md`: any project marked "active" that hasn't had a status update in 60+ days? Flag as possibly stale.
- Check the `Scheduled/archive/` folder vs the active `Scheduled/` folder for naming overlap (task moved but not removed from registrations).

### Phase 4 — Open items from prior audits

Find prior `SYSTEM-AUDIT-*.md` files in `Claude/`. For each prior audit's "Prioritized fix plan":
- Which P0 items are resolved (or still open)?
- Which P1 items are resolved (or still open)?
- Any items that have been pending across multiple audits → flag as chronic

### Phase 5 — Self-improvement opportunities

Identify capability gaps and friction patterns by inspecting:
- `Claude/memory/report-lessons.md` recent entries — are there repeated mistakes that a tool/hook could prevent?
- `Claude/memory/email-lessons.md` recent entries — same question
- `Claude/memory/feedback/` newest entries — what corrections has Tish given that suggest missing tooling?

Surface 2-4 concrete tool/hook proposals that match the "close my capability gap" pattern (like `TAS-Gmail-Downloader.py` or the preflight hook).

### Phase 6 — Architectural coherence
- Does ARCHITECTURE.md's described layers match what actually exists?
- Are there now hooks/tools/skills not mentioned in ARCHITECTURE.md?
- Are there gaps between intended behavior (e.g. "tas-monthly-housekeeping audits CLAUDE.md bloat") and observed behavior (did it actually run? did CLAUDE.md actually shrink?)

## Output: `SYSTEM-AUDIT-YYYY-MM-DD.md`

Follow the format of `SYSTEM-AUDIT-2026-05-20.md` (as a guide, not a strict template):

```markdown
# TAS Claude System Audit
**Date:** YYYY-MM-DD · **Mode:** Diagnose + propose plan (no changes made)

## Verdict in one paragraph
<2-4 sentences summarizing system health, what's working, what's drifting>

| Goal | Grade | One-line reason |
|------|-------|-----------------|
| Efficient (lean, low-noise) | A-/B+/etc. | ... |
| Self-improving / learning | ... | ... |
| Top-notch outputs | ... | ... |
| Automated & organized | ... | ... |

## What's working well (keep doing this)
<3-5 bullets of healthy patterns>

## Findings (by dimension)
### 1. Self-improvement loop
### 2. Bloat & redundancy
### 3. Automation coverage
### 4. Output quality

## Prioritized fix plan
### P0 — Do first (correctness/safety/drift)
| # | Fix | Why it matters | Effort |

### P1 — Do soon (efficiency & self-maintenance)
### P2 — Hygiene (low risk, quick wins)

## Self-improvement opportunities
<2-4 tool/hook proposals from Phase 5>

## Open items from prior audits
<Rollup of what's resolved and what's chronic>

## Suggested sequencing
<2-3 paragraphs on what to tackle in what order>
```

## After writing

- Add a flag to `Claude/memory/projects/active-projects.md`: `- ⚠️ [Quarterly audit ready for review] SYSTEM-AUDIT-YYYY-MM-DD.md — review for P0 action items`
- Commit + push to backup: `git push origin main:backup/auto`
- DO NOT auto-action anything from the audit. The audit's job is to surface; Tish's interactive review session does the deciding.

## Don't change anything

Pure diagnostic. The only writes allowed are: (a) the audit file, (b) the active-projects flag, (c) the git commit + push. No code edits, no memory edits, no hook tweaks, no settings.json changes.
