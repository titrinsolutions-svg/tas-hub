# TAS Weekly System Health Check — RETIRED 2026-05-21

This audit prompt has been **retired** and replaced by a faster, cheaper, more responsive design:

- **Mechanical checks** (git, backup, settings, verifiers, learning loops, deploy match) now run as a **Python script** at every session start via a SessionStart hook:
  - Script: `C:/Users/Tish/Desktop/TITRIN/Claude/TAS - Tools/system_health.py`
  - Hook: `C:/Users/Tish/Desktop/TITRIN/.claude/settings.json` → `hooks.SessionStart`
  - Cost: $0 (no LLM tokens — pure Python)
  - Cadence: every Claude Code / Cowork session start (daily, since the app auto-launches each morning)
  - Surface: `systemMessage` in the UI when anything is non-green; silent on all-green; appended to `TITRIN/Claude/health-reports/log.md`; FAILs flagged in `active-projects.md`

- **Deeper checks** (cross-reference integrity, drift detection, build/type-check, semantic analysis) belong in the **quarterly audit** — see `quarterly-self-audit.md`. Build + type-check are too slow (~3 sec) for a session-start hook and don't need weekly frequency.

The matching scheduled task `tas-weekly-health-check` was disabled 2026-05-21. To re-enable: `mcp__scheduled-tasks__update_scheduled_task` with `enabled: true` (but the SessionStart hook is the better path).

## Why this changed

I (Claude) initially proposed a weekly Claude session for these checks. Tish challenged this on token cost and design quality. Honest reassessment: 5 of the 7 weekly checks were mechanical and didn't need an LLM. A Python script does them in <1 sec for $0; the LLM wrapper was wasted overhead.

The SessionStart hook also fires when Tish is actually at her PC (not at 8am Monday whether or not she's there), so issues surface the moment she sits down rather than up to 6 days late.

Net win: better coverage cadence, faster issue surfacing, $0 cost.
