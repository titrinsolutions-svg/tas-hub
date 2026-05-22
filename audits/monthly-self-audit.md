# TAS Monthly Self-Audit

A deep system audit that runs the 1st of every month. Goes further than the per-session SessionStart hook: looks back across recent sessions for friction patterns, reads the candidate-edits queue, surfaces architectural drift, and tracks chronicness of findings across audits.

**Cadence:** Monthly (changed from quarterly 2026-05-21 to match the pace at which Cowork actually changes things during business operations).

## Paths
- **tas-hub repo:** `C:\Users\Tish\Downloads\tas-hub`
- **TITRIN brain:** `C:\Users\Tish\Desktop\TITRIN`
- **Audit output:** `C:\Users\Tish\Desktop\TITRIN\Claude\SYSTEM-AUDIT-YYYY-MM-DD.md`
- **Candidate edits queue:** `C:\Users\Tish\Desktop\TITRIN\Claude\CANDIDATE-EDITS.md`
- **Python:** `C:/Users/Tish/AppData/Local/Microsoft/WindowsApps/python.exe`

## Phase 1 — Baseline

Run `C:/Users/Tish/Desktop/TITRIN/Claude/TAS - Tools/system_health.py` and capture the output. Also run `npx tsc --noEmit` and `npm run build` in `C:/Users/Tish/Downloads/tas-hub` (slow checks not in the session-start hook). Together these are the mechanical state of the system.

## Phase 2 — Cross-reference integrity (subagent)

Dispatch an Explore-type subagent with this prompt:

> Audit the TITRIN brain at `C:\Users\Tish\Desktop\TITRIN` for cross-reference integrity. Read-only. Verify every file path in `CLAUDE.md`, `Claude/ARCHITECTURE.md`, `Claude/memory/MEMORY.md` actually exists. Verify scheduled tasks listed in ARCHITECTURE.md Layer 4 match folders in `Claude/Scheduled/`. Verify tools in Layer 5 match `Claude/TAS - Tools/`. Look for stale references — V1 URLs, retired endpoints, archived files still mentioned as active, deadlines that have passed. Report 🟢/🟡/🔴 tiered findings, under 600 words. Don't fix anything.

## Phase 3 — Drift indicators

- Grep `Claude/memory/` for mentions of any tool or file moved to `_archive/`. Flag each as stale doc.
- Check the "Items Needing Attention" block in `CLAUDE.md` — any hard deadlines passed?
- Read `Claude/memory/projects/active-projects.md` — any "active" project untouched 60+ days?
- Compare `Scheduled/archive/` vs active `Scheduled/` — naming overlap (task moved but not removed from registrations)?

## Phase 4 — Friction-pattern search via claude-mem (best-effort)

Use the claude-mem MCP tools (`mcp__plugin_claude-mem_mcp-search__smart_search`, `mcp__plugin_claude-mem_mcp-search__timeline`, `mcp__plugin_claude-mem_mcp-search__search`) to look back across recent Claude sessions for recurring patterns:

- Search for patterns like "Tish corrected", "Tish pushed back", "fixed manually", "had to do by hand", "wished I could", "couldn't do" — frustration signals
- Search for any specific tool/skill names that appear repeatedly with negative context
- Timeline view: what topics have come up multiple times in the last 30 days?
- Build a list of friction events with date + session context

For each recurring pattern (≥2 instances in 30 days), propose a candidate edit. Examples:
- "Drainage prediction-verb correction needed 4× in 30 days" → candidate: tighten the linter in verify_report.py or strengthen the rule in tas-report-writer prompt
- "Manual download of Drive attachment 3×" → candidate: extend Gmail downloader to handle Drive-only links
- "Same fee-proposal formatting fix 5×" → candidate: add a verify_quotation.py + extend the preflight hook

**Best-effort caveat:** the claude-mem corpus may be too sparse to produce meaningful signal in early audits (this was the case at the first audit 2026-05-21 — every search variant returned roughly the same 13-18 observations from one April-13 cluster). If searches return little new signal beyond what the in-session capture mechanism already surfaced into CANDIDATE-EDITS.md, note this in the audit verdict ("claude-mem corpus immature; Phase 4 produced thin signal") and continue to Phase 4-Lite below. Re-evaluate Phase 4's load-bearing status once the corpus exceeds ~500 observations.

## Phase 4-Lite — Recent feedback + lessons clustering (fallback signal source)

When Phase 4 returns thin signal (likely in the first few months), supplement with these cheap reads of structured memory:

1. **Recent feedback memory:** `ls -t Claude/memory/feedback/*.md | head -10` — what's been written or modified in the last 30 days? Sort by mtime; cluster by theme (drainage, branding, automation, etc.). Repeated themes = candidates.
2. **Recent auto-memory entries:** read `C:/Users/Tish/.claude/projects/C--Users-Tish-Downloads-tas-hub/memory/MEMORY.md` and sort entries by their file's mtime. Multiple recent feedback-type entries on the same surface area = candidate to address structurally.
3. **report-lessons.md and email-lessons.md:** check the most recent 5-10 entries each. If a lesson keeps getting reinforced (similar correction appearing multiple times), the rule probably belongs in code (a verifier check, a hook, a linter) rather than as a memory entry Claude must remember.

Phase 4-Lite findings get the same treatment as Phase 4: propose candidate edits to CANDIDATE-EDITS.md with clear "first seen / reinforced" tracking.

## Phase 5 — Recent feedback-memory analysis

Read `C:\Users\Tish\.claude\projects\C--Users-Tish-Downloads-tas-hub\memory\` and the TITRIN `Claude/memory/feedback/` folder. Sort by mtime. For entries created or modified in the last 30 days:
- What new behavioral corrections came up?
- Do any of them suggest a tool/skill/hook change rather than just a behavioral rule?
- Are there feedback entries that contradict each other (drift in instructions)?

## Phase 6 — Open items + chronicness rollup

Read all prior `SYSTEM-AUDIT-*.md` files in `Claude/`. For each P0/P1/P2 item across history:
- Resolved? (verify by checking actual state)
- Still open?
- **Chronic** = appeared in ≥2 prior audits without resolution

Read `CANDIDATE-EDITS.md`. For each existing entry:
- Status changed since last audit? (APPLIED / REJECTED / DEFERRED)
- If still PROPOSED, increment its "reinforcement count" if today's audit reinforces it
- If first-seen date is >6 months and still PROPOSED, flag as chronic-stalled

## Phase 7 — Update CANDIDATE-EDITS.md

Append new candidates from Phase 4 + 5 + 6, or update existing ones with new reinforcement.

Format each entry as:

```markdown
## [TARGET-FILE]: [short title]
**Status:** PROPOSED
**Confidence:** HIGH / MEDIUM / LOW
**First seen:** YYYY-MM-DD (audit YYYY-MM)
**Reinforced:** 1× / 2× / 3× (last: YYYY-MM)
**Target:** path/to/file
**Change:** specific edit (lines, sections, or "add new helper function X")
**Why:** 1-2 sentences with evidence (cite friction events, prior audits, feedback entries)
**Risk if applied:** what could break
**Risk if NOT applied:** what continues to cost
```

Sort the file: newest PROPOSED on top, then chronic-stalled, then APPLIED/REJECTED archived at bottom.

## Phase 8 — Architectural coherence

- Does `ARCHITECTURE.md`'s described layers match what actually exists?
- Are there new hooks/tools/skills not mentioned in ARCHITECTURE.md?
- Are there documented behaviors (e.g. "tas-monthly-housekeeping audits CLAUDE.md bloat") that aren't actually happening?

## Output: `SYSTEM-AUDIT-YYYY-MM-DD.md`

Following the structure of `SYSTEM-AUDIT-2026-05-20.md`:

```markdown
# TAS Claude System Audit
**Date:** YYYY-MM-DD · **Cadence:** Monthly · **Mode:** Diagnose + propose plan (no changes made)

## Verdict in one paragraph

## Four-axis grades
| Goal | Grade | One-line reason |
|------|-------|-----------------|
| Efficient (lean, low-noise) | ... | ... |
| Self-improving / learning | ... | ... |
| Top-notch outputs | ... | ... |
| Automated & organized | ... | ... |

## What's working well (keep doing)

## Findings (by dimension)
### 1. Self-improvement loop
### 2. Bloat & redundancy
### 3. Automation coverage
### 4. Output quality
### 5. Friction patterns from past sessions (claude-mem)

## Candidate edits queue summary
- N new candidates appended this audit
- N reinforced (already in queue, seen again)
- N applied since last audit
- N chronic-stalled (>6 months open)
- See CANDIDATE-EDITS.md for full queue

## Prioritized fix plan
### P0 — Do first (correctness/safety/drift)
### P1 — Do soon (efficiency & self-maintenance)
### P2 — Hygiene (low risk, quick wins)

## Open items from prior audits

## Suggested sequencing
```

## After writing

- Update `CANDIDATE-EDITS.md` with new/reinforced entries
- If there are **new HIGH-confidence candidates** or **any P0 findings**, append a flag to `Claude/memory/projects/active-projects.md`: `- ⚠️ [Monthly audit YYYY-MM-DD] N new HIGH candidates, N P0 findings — review at next interactive session`
- Commit + push to backup: `git push origin main:backup/auto`
- DO NOT auto-action any candidate edits. The interactive improvement session (when Tish opens Claude Code and asks for one) is where edits get applied with judgment.

## Don't change anything

Pure diagnostic + queue management. The only writes allowed are: (a) the audit file, (b) CANDIDATE-EDITS.md, (c) the optional active-projects flag, (d) git commit + push. No code edits, no memory edits beyond CANDIDATE-EDITS, no hook tweaks, no settings.json changes.
