# Wave 1 spec — reconnect MEASURE + give the regression net a standing trigger

> Source: 2026-06-23 whole-system audit (22-agent, adversarially verified). Keystone moved PROPAGATE→MEASURE.
> Execute in **Cowork** (these touch TITRIN tools + a scheduled task). All changes are reversible, draft-only,
> and touch no send/money/stamp path. Ground-truth every shape against the real bridge before editing (VISION P6).

## GATE 0 — RESOLVED: this is a REAL money error, not a stale test (Tish, 2026-06-23)
Tish confirmed the intended rate is **$250/hr + $200 per site visit** (the $200 is on top of the hourly time).
The generator currently maps `[250]`→$250 (correct) but **`[400]`→$400** (`TAS-Agreement-Generator.py:98`) — the
**site-visit fee is doubled.** Commit `168a1da` (the "Auto-backup 2026-06-23 22:08" commit) changed the original
`("[200]","$200")` to `("[400]","$400")` and the live template token to `[400]`. The audit's verifier wrongly
concluded the template was authoritative and the test was merely stale — it is NOT; the $400 is WRONG.

**Therefore Change B is elevated from "fix a stale test" to "fix a client-facing money error in a legal tool."**
The correct fix RESTORES $200 (revert `168a1da`'s fee change), which also makes the existing test pass as-written.
**Blast-radius check (do first, in Cowork):** has any agreement been generated/sent with the wrong $400 since
`168a1da`? The generator never auto-sends (Tish sends each one), so it likely didn't reach a client unnoticed —
but check `TAS - Client Agreements/` (and Gmail drafts) for any agreement carrying $400, and have Tish confirm.

---

## Change A — fix the broken automatic learning-capture (the MEASURE keystone)

**Root cause (verified live):** `tas_signal.py` `_thread_messages_via_bridge` (~L430-448) reads the bridge response as
`data.get("messages", [])` (L442), but the real `bridge_client.py thread --full` response nests the payload under
`data["result"]["messages"]`. Result: every reconcile fetch returns 0 messages → `select_sent_body` returns None →
nothing is ever recorded or retired. Live proof: 3 snapshots stuck pending since Jun 10, no `_state/.../_done/`
archive dir ever created, `tas_signal.py stats` shows `byAction={edit:10}`, **editRate pinned at 1.0** — so the
VISION P4 autonomy-gate fitness metric can never trend down. A second defect: the `--full` digest reportedly
carries no per-message `body` field, so even after the envelope fix the body must be mapped from the real key.

**Steps:**
1. **Ground-truth the shape first (P6).** Run the real bridge on a known live thread and read the actual JSON:
   `python3 "Claude/TAS - Tools/bridge_client.py" thread --thread-id 19eae4399b8836ad --full`
   Confirm (a) messages live under `result.messages`, and (b) the exact per-message keys for sender, date, and
   the de-quoted body text.
2. **Fix the envelope read** at `_thread_messages_via_bridge` L442 — read from the envelope, defensively so a
   flat shape still works:
   `for m in ((data.get("result") or data).get("messages") or []):`
3. **Fix the body/date mapping** (L444/L447) to the REAL field names found in step 1. If `--full` digests omit
   per-message bodies, switch this adapter to the bridge mode that returns the full de-quoted body per message
   (keep de-quoting; never draft/diff from a snippet). `select_sent_body` needs a non-empty body to record.
4. **Antifragile test (P5) — this is mandatory, not optional.** Add an integration test in `test_signal.py` that
   exercises `_thread_messages_via_bridge` against the TRUE bridge envelope (a recorded fixture of real
   `thread --full` output, incl. `result.messages` nesting + the real body key). The current tests pass a fake
   that returns the already-unwrapped `{from,ts,body}` shape — that fake is exactly why this bug shipped green.
   The new test must fail against the OLD top-level-`messages` code and pass against the fix.

**Verify:**
- `python3 "Claude/TAS - Tools/tas_signal.py" reconcile` → `recorded` > 0 (the 3 stuck snapshots resolve), a
  `_done/` archive dir now appears.
- `python3 "Claude/TAS - Tools/tas_signal.py" stats` → `byAction` now contains non-edit entries as Tish-sent
  drafts reconcile; editRate is no longer structurally pinned at 1.0.
- `python3 "Claude/TAS - Tools/run_test_suite.py"` → green (incl. the new integration test).

**Guardrails:** pure cores unchanged; snapshots/retire stay reversible; diff is structure-only (injection-safe);
no send path touched. This is a code-adapter fix, not a new capture path — the consumer (`aggregate`/editRate),
producer (`reconcile_one`+`decide`), and SKILL steps all already exist.

---

## Change B — give the 660-test regression net a standing daily trigger

**Root cause (verified live):** `run_test_suite.py` runs the full suite (~660 tests, stdlib, ~5s, no network) and
writes the `_state/tests-last-run.json` sentinel that the doctor's `check_tests_last_run` (health_checks.py:~747)
reads (FAIL on recorded failure, WARN if stale >10d). But **nothing runs it automatically** — only when a human
types the command. So the suite silently went RED (a stale test, see Gate 0) and the doctor kept reading a stale
green sentinel. The net was never pulled.

**Steps:**
1. **First fix the real error, then the suite goes green on its own.** Per Gate 0, the site-visit fee must be
   **$200, not $400**. Against the REAL template (`TAS - Client Agreements/Templates/Titrin_Client_Agreement -
   (5) Stamp.docx`), revert commit `168a1da`'s fee change end-to-end: restore the `("[200]","$200")` mapping in
   `build_replacements` (`TAS-Agreement-Generator.py:98`, replacing the wrong `("[400]","$400")`) **and** restore
   the template's site-visit placeholder token to `[200]`. Verify against the .docx which line `[400]` sits on
   before editing (confirm it is the site-visit fee, P6). The existing `test_agreement_generator.py:30-33` already
   asserts `[200]`→`$200`, so it passes once the code is reverted — do not change the test. Re-run
   `run_test_suite.py` → green. Then generate ONE sample agreement and have Tish confirm it reads $250/hr + $200/visit.
2. **Wire the daily trigger.** Add a one-line suite run to **`end-of-day-update`** (the weekday maintenance pass
   that already runs the backup + tracker work — the natural home; midday-sweep is deliberately light). Per the
   SKILL-edit-location rule: edit the **canonical** `Documents\Claude\Scheduled\end-of-day-update\SKILL.md` first,
   then mirror to the repo copy. Add near the health/backup work:
   `python3 "Claude/TAS - Tools/run_test_suite.py"` — and surface a non-zero exit (recorded failure) at the TOP of
   the EOD report so a red suite is loud, not silent. This guarantees the sentinel is refreshed every weekday, so
   `check_tests_last_run`'s 10-day WARN can never be the first signal of a regression.

**Verify:** after one EOD run, `_state/tests-last-run.json` shows today's date + `ok:true`; the doctor
(`system_health.py --sandbox`) reports `check_tests_last_run` PASS.

**Optional stronger follow-on (not Wave 1):** also run the suite inside `GIT-BACKUP.py`'s integrity-gate path
(`staged_integrity_ok`) when staged changes touch `Claude/TAS - Tools/*.py`, aborting the auto-backup on a
recorded failure — catches a regression AT commit time, before it's backed up. Log as a Wave-2 hardening item.

---

## Done-when
- editRate is no longer pinned at 1.0 (approves/edits both flow as Tish sends reconcile-tracked drafts).
- The test suite runs every weekday and a red suite is surfaced in the EOD report + FAILs the doctor.
- Both changes have a regression test; nothing in the send/money/stamp path changed.
