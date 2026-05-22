# RETIRED 2026-05-21 → see `monthly-self-audit.md`

The quarterly cadence was bumped to **monthly** because:
- Cowork actively runs the business daily, so things change faster than quarterly catches
- Cost difference is negligible (~$12/year vs ~$4/year)
- Pairs naturally with `tas-monthly-housekeeping`
- More data points enable trend detection ("flagged 3 months in a row" signal)

The audit logic was also extended:
- **Phase 4** now uses `claude-mem` to search past sessions for friction patterns (corrections, manual workarounds, repeated questions)
- **Phase 5** reads recent feedback-memory entries for emerging behavioral corrections
- **Phase 7** appends to a `CANDIDATE-EDITS.md` queue at `TITRIN/Claude/CANDIDATE-EDITS.md` — a running list of proposed improvements that Tish reviews during interactive sessions
- **Chronicness tracking** — entries reinforced across audits get flagged; ones unresolved >6 months become CHRONIC-STALLED

The scheduled task `tas-quarterly-self-audit` (taskId kept as historical artifact) was reconfigured to run monthly (`0 9 1 * *`) and points at `monthly-self-audit.md`.

**To find the actual audit:** see `monthly-self-audit.md` in this folder.
