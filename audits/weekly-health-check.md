# TAS Weekly System Health Check

Run a read-only audit of the TAS Hub portal + TITRIN brain, write a traffic-light findings file, and commit it. Designed to run automatically each week and stay silent when everything is healthy.

## Paths (Windows)
- **tas-hub repo:** `C:\Users\Tish\Downloads\tas-hub`
- **TITRIN brain:** `C:\Users\Tish\Desktop\TITRIN`
- **Live deploy:** https://tas-hub-titrin.netlify.app
- **Python:** `C:/Users/Tish/AppData/Local/Microsoft/WindowsApps/python.exe`
- **Output file:** `C:\Users\Tish\Desktop\TITRIN\Claude\health-reports\SYSTEM-HEALTH-YYYY-MM-DD.md` (today's date)

## The 7 checks

For each, classify as 🟢 PASS / 🟡 WARN / 🔴 FAIL.

1. **tas-hub git** — clean working tree + in sync with `origin/main`
   - `cd` to repo; `git status -sb`; `git log -1 --format='%h %ci %s'`
   - Uncommitted changes → 🟡 (list what)
   - Diverged from `origin/main` → 🟡

2. **tas-hub deploy match** — live bundle = local build
   - `curl -s https://tas-hub-titrin.netlify.app/` and grep `index-[hash].js`
   - `ls dist/assets/index-*.js`
   - Different hash → 🟡 (might be mid-deploy; note the gap)

3. **tas-hub build health** — type-check + build both pass
   - `npx tsc --noEmit` (silent = pass)
   - `npm run build` (success = pass; warnings ≠ fail)
   - Errors → 🔴

4. **TITRIN git + backup freshness**
   - `cd` to TITRIN; `git status -sb`; `git log -5`
   - `git fetch origin --quiet`; check `origin/backup/auto` last commit time
   - Any local main commits NOT on any backup branch → 🔴 (data-loss risk)
   - Backup branch > 24h old → 🟡

5. **Preflight hook end-to-end**
   - Pipe-test 3 scenarios with the absolute python path:
     - Report PASS (existing clean LCA docx) → expect silent exit 0
     - Report FAIL (a docx in a report folder without References section) → expect JSON with `"decision": "block"`
     - Non-TAS path → expect silent
   - Wrong output on any → 🔴

6. **Link integrity in TITRIN brain**
   - Verify every file path referenced in `Claude/ARCHITECTURE.md` exists
   - Verify every file path referenced in `CLAUDE.md` exists
   - Missing files → 🟡 (list which doc references which missing file)

7. **Learning loops alive**
   - mtime of `Claude/memory/email-lessons.md` < 30 days → 🟢
   - mtime of `Claude/memory/report-lessons.md` < 30 days → 🟢
   - Either > 30 days → 🟡 (loop may have stalled)

## Output format

Write to the output file path above. Format:

```markdown
# TAS System Health — <YYYY-MM-DD>

**Overall: 🟢 / 🟡 / 🔴**

## Status
| # | Check | Status |
|---|-------|--------|
| 1 | tas-hub git | 🟢 |
| 2 | tas-hub deploy match | 🟢 |
| 3 | tas-hub build | 🟢 |
| 4 | TITRIN git + backup | 🟢 |
| 5 | Preflight hook | 🟢 |
| 6 | TITRIN link integrity | 🟢 |
| 7 | Learning loops | 🟢 |

## Details
<Only include this section for 🟡 / 🔴 items. Skip entirely if all 🟢.>

## Action items
<Only if any 🔴 or actionable 🟡. Brief, imperative.>
```

## After writing

- If any 🔴 finding: also append a flag line to `C:\Users\Tish\Desktop\TITRIN\Claude\memory\projects\active-projects.md` so the daily brief picks it up. Format: `- ⚠️ [Weekly health] <one-line summary> — see SYSTEM-HEALTH-YYYY-MM-DD.md`
- Commit the health report (and any active-projects update) in the TITRIN repo: `git commit -m "Weekly health check: <overall>"`
- Push the commit to `backup/auto` for safety: `git push origin main:backup/auto`

## Self-rule: don't pad green reports

If ALL 7 checks are 🟢, the body should be ONE LINE: `All systems nominal.` No details section, no action items section. The whole file should be ~15 lines. Silent-success is the design.

## Don't change anything

This is a READ-ONLY audit. Do not run fixes, do not edit code or memory files, do not modify the hook, do not touch settings.json. The only writes allowed are: (a) the health report file, (b) the optional active-projects flag, (c) the git commit + push. Anything else found should be noted in Details, not auto-fixed — leaves the actual repair as a conscious decision in the next interactive session.
