# TAS Daily Brief Redesign + Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Executor note:** This plan modifies a LIVE business system (a running scheduled task, a running host daemon, and the TITRIN brain). It is NOT a greenfield repo and has no pytest suite for most targets. Do NOT fan this out to context-less subagents — execute inline, with a checkpoint between phases. Each phase is independently shippable and reversible.

**Goal:** Replace the messy, never-read Gmail-Drafts "morning briefing" with a tight, scannable, numbered brief delivered to Tish's inbox via a safe self-only channel; make a missed evening run self-heal; retire the stale Obsidian vault; and fix the host-bridge heartbeat false-DOWN.

**Architecture:** The Cowork `end-of-day-update` task (weekdays 17:30) generates a tight brief, writes a clean email body + a machine-readable "resolution map" into `TITRIN/Claude/_state/`, then sends the email to Tish's own inbox through a new **self-only** bridge action (`notify.self`, recipient hardcoded — structurally cannot email a client, so it never touches the gated client-send guard), falling back to a Gmail draft if the daemon is down. A SessionStart health check detects a missed run and nudges a catch-up. The bridge daemon gains a mount-proof `beats/` heartbeat so its liveness is reported truthfully.

**Tech stack:** Python 3 (stdlib + googleapiclient), Cowork scheduled-task SKILL.md (prose), Claude Code SessionStart hook, the existing TAS host bridge (request/response over the TITRIN mount).

---

## Conventions for this plan (read once)

- **Runtime vs mirror:** the task's live spec is `C:\Users\Tish\Documents\Claude\Scheduled\end-of-day-update\SKILL.md` (this is what Cowork actually runs). The TITRIN copy at `TITRIN\Claude\Scheduled\end-of-day-update\SKILL.md` is a **mirror** that `GIT-BACKUP.py` refreshes FROM the runtime nightly. **Always edit the runtime copy.** Never edit the mirror (it gets overwritten).
- **No manual git in TITRIN.** All TITRIN edits (`Claude/...`, `CLAUDE.md`, moved folders) are committed + pushed automatically by the host `TAS-Git-Backup` task (~18:55 daily). Do not `git push` TITRIN by hand (CLAUDE.md: ask-first). The tas-hub repo (this plan doc) is committed normally.
- **Brain-write safety:** do not Edit/Write files near the ~31 KB truncation ceiling (`active-projects.md`, archives). The files this plan touches (`CLAUDE.md`, the scripts, `_state/*`) are all small — Edit is safe. Still, read `TITRIN/.claude/hooks/brain_guard.py` before editing `CLAUDE.md` to respect its intent (Phase 2, Step 0).
- **Self address:** Tish's address is `titrinsolutions@gmail.com`. The brief is sent to self only.
- **Validation honesty:** host-side checks are runnable now (this is a host Claude Code session). Two things can only be *fully* validated in a real Cowork session and are flagged as such: (a) the mount propagation of `beats/` into the sandbox, (b) the actual scheduled task firing. Do not claim those green from the host.

---

## File map

| File | Action | Responsibility |
|------|--------|----------------|
| `Documents\Claude\Scheduled\end-of-day-update\SKILL.md` | Modify (STEP 6 + new STEP 6B) | Generate the tight brief, write `_state/` artifacts, send via `notify.self` with draft fallback, stamp the run marker |
| `TITRIN\Claude\_state\` | Create (dir) | Holds `brief-<date>.md` (clean brief), `brief-context.json` (resolution map for "do N"), `last-end-of-day.json` (run marker) |
| `TITRIN\Claude\TAS - Tools\system_health.py` | Modify | Add `check_brief_today()` (missed-run nudge) + add `beats` to bridge liveness dirs |
| `TITRIN\Claude\TAS - Tools\TAS-Host-Bridge.py` | Modify | Add mount-proof `beats/` heartbeat + the self-only `notify.self` action |
| `TITRIN\Claude\TAS - Tools\bridge_client.py` | Modify | Add `beats` to `heartbeat_age()` + a `notify` subcommand |
| `TITRIN\CLAUDE.md` | Modify | Remove the 2 TAS-Brain lookup-index rows; add the catch-up instruction |
| `TITRIN\TAS-Brain\` | Move | → `TITRIN\Claude\_archive\TAS-Brain-retired-2026-06-02\` (reversible) |

---

## Phase 1 — Tight brief format + `_state/` artifacts (lowest risk: prose + new dir)

**Files:**
- Create: `C:\Users\Tish\Desktop\TITRIN\Claude\_state\README.md`
- Modify: `C:\Users\Tish\Documents\Claude\Scheduled\end-of-day-update\SKILL.md` (replace STEP 6, add STEP 6B)

- [ ] **Step 1: Create the `_state` directory with a purpose note**

Create `C:\Users\Tish\Desktop\TITRIN\Claude\_state\README.md`:

```markdown
# _state — runtime state for the daily brief + catch-up

Small machine-written files (safe for native edit; all < 5 KB). Not hand-edited.

- `brief-YYYY-MM-DD.md` — the clean brief that was emailed (last ~7 kept).
- `brief-context.json` — resolution map for the most recent brief: numbered item → {file#, draftId, threadId, action}. When Tish says "do 2 and 4" in Cowork, read this to resolve the numbers with full context.
- `last-end-of-day.json` — {"date":"YYYY-MM-DD","status":"ok","delivery":"inbox|draft"} stamped when end-of-day-update completes. system_health.py reads it to detect a missed run.
```

- [ ] **Step 2: Replace STEP 6 of the runtime SKILL.md**

Open `C:\Users\Tish\Documents\Claude\Scheduled\end-of-day-update\SKILL.md`. Replace the entire `## STEP 6 — Draft next-morning briefing` section (the fenced format + "Save to Gmail Drafts. Never send.") with:

```markdown
## STEP 6 — Build the tight morning brief (format is mandatory — keep it scannable)

The brief must be glanceable in ~10 seconds on a phone, NOT a wall of text. Hard rules:
- ONE headline action at the top (`▶ #1 TODAY`) — the single most important thing.
- Number ACT and FOLLOW-UP items CONTINUOUSLY (1,2,3…) so Tish can reply "do 2 and 4".
- Caps: ACT ≤ 6, FOLLOW-UP ≤ 3, FYI ≤ 4. If ACT overflows, add a final line "…+N more in active-projects.md". OMIT any empty section entirely.
- Plain language, one line per item: who/which file + the concrete next step.

Compose this body (this exact shape):

​```
TAS BRIEF — <Day Mon DD>

▶ #1 TODAY: <single most important action — one line>

🔴 ACT — reply "do 1,3" and I'll action them
 1. <file# / who> — <verb + concrete next step>
 2. ...

🔔 FOLLOW-UP — aging, nudge soon
 N. <client/project> — <what's pending>, <age> → nudge

✉️ DRAFTS WAITING (<count>): <topic> · <topic>

👀 FYI — no action
 • <deadline this week / quiet note>

— Full context saved. In Cowork, just say "do 2 and 4".
​```

Section sourcing:
- **#1 TODAY / ACT:** the genuine must-dos from today's mail + active-projects.md "⚠️ Hard deadlines / this week". Hard deadlines and new-inquiry acknowledgments (STEP 1C) outrank everything.
- **FOLLOW-UP (STEP 6B below):** pipeline items going quiet.
- **DRAFTS WAITING:** count + topics of the Gmail drafts you created today (new-inquiry acks, replies). Topics only — never paste draft bodies.
- **FYI:** this-week deadlines not yet actionable, the host-backup line from STEP 7, any health flag.

Then write the two `_state` artifacts (native write — small files):
1. `Claude/_state/brief-<YYYY-MM-DD>.md` — the brief body above. Delete `brief-*.md` older than the last 7.
2. `Claude/_state/brief-context.json` — the resolution map so a later session can action "do N" without re-deriving:
   ​```json
   {"date":"<YYYY-MM-DD>","items":{"1":{"file":"26.0018","project":"21700 River Rd (Cheema)","action":"confirm Jun 5 removal start","draftId":null,"threadId":null},"2":{...}}}
   ​```
   Include every numbered ACT + FOLLOW-UP item, with the draftId/threadId when the item has an associated Gmail draft/thread.

Delivery happens in STEP 6C (added by the inbox-delivery phase). Until that phase lands, ALSO save the brief to Gmail Drafts as before so nothing regresses.
```

> Note the three `​```` fences above are shown with a zero-width char in this plan doc only to nest them; when editing SKILL.md use normal triple-backticks.

- [ ] **Step 3: Add STEP 6B (FOLLOW-UP derivation) right after STEP 6**

Insert:

```markdown
## STEP 6B — Derive the FOLLOW-UP list (revenue lens)

From active-projects.md (already updated in STEP 2) + today's mail, list up to 3 items where TAS is the one waiting and a nudge is overdue. Include an item only if it meets a threshold:
- A fee proposal / Consulting agreement / quote SENT with no client reply for > 3 business days.
- An active project with NO client/municipal contact in > 14 days that isn't deliberately parked.
- A signed-but-unscheduled next step (e.g. dig booked, awaiting confirmation) gone quiet > 5 days.
Most-overdue first; one line each: "<client/project> — <what's pending>, <age> → nudge". Omit the whole FOLLOW-UP section if nothing qualifies. Do NOT draft the nudges here — Tish actions them by replying "do N"; that's the weekly-business-review/project-runner job on demand.
```

- [ ] **Step 4: Render a sample to sanity-check the format (host-side validation)**

Read `TITRIN/Claude/memory/projects/active-projects.md` and hand-render one brief in the new shape using today's real data. Confirm it fits ~a phone screen and every ACT item is one line. (This is a format check only; real generation is the task's job on the next run.)

- [ ] **Step 5: Checkpoint**

No git step (runtime SKILL.md is outside the repo; `_state/README.md` + the eventual artifacts are auto-backed-up nightly). Pause and show Tish the rendered sample before continuing.

**Rollback:** restore the previous STEP 6 text (kept in the TITRIN mirror copy / git history); delete `_state/`.

---

## Phase 2 — Retire the Obsidian `TAS-Brain` vault (reversible move)

**Files:**
- Read first: `C:\Users\Tish\Desktop\TITRIN\.claude\hooks\brain_guard.py`
- Move: `TITRIN\TAS-Brain\` → `TITRIN\Claude\_archive\TAS-Brain-retired-2026-06-02\`
- Modify: `TITRIN\CLAUDE.md` (remove 2 rows)
- Create: `TITRIN\Claude\_archive\TAS-Brain-retired-2026-06-02\WHY-RETIRED.md`

- [ ] **Step 0: Read `brain_guard.py`** to confirm what it blocks, so the `CLAUDE.md` edit respects its intent (it won't fire in this tas-hub session, but match its rules).

- [ ] **Step 1: Enumerate every reference to the vault**

Grep the brain for live pointers that would send a future session to the dead vault:
- Search `TITRIN\CLAUDE.md`, `TITRIN\Claude\**\*.md` for `TAS-Brain`.
- Expected hits: the 2 lookup-index rows in `CLAUDE.md` ("Compressed stable-facts primer" → `TAS-Brain/01-COMPRESSED-CONTEXT.md`; "External-brain vault (Obsidian)" → `TAS-Brain/`). Note any others.

- [ ] **Step 2: Move the vault (reversible)**

```powershell
New-Item -ItemType Directory -Force "C:\Users\Tish\Desktop\TITRIN\Claude\_archive" | Out-Null
Move-Item "C:\Users\Tish\Desktop\TITRIN\TAS-Brain" "C:\Users\Tish\Desktop\TITRIN\Claude\_archive\TAS-Brain-retired-2026-06-02"
```

- [ ] **Step 3: Remove the 2 lookup-index rows from `CLAUDE.md`** (the `TAS-Brain/01-COMPRESSED-CONTEXT.md` row and the `TAS-Brain/` external-brain-vault row). Leave the rest of the table intact.

- [ ] **Step 4: Fix any other references** found in Step 1 (replace with the canonical `Claude/memory/...` source, or delete the pointer).

- [ ] **Step 5: Leave a tombstone** — `WHY-RETIRED.md` in the archived folder: one paragraph (retired 2026-06-02; evolution loop never ran past creation; duplicated `Claude/memory/`; held stale Cloudflare/Render deploy info; restore by moving back if ever wanted).

- [ ] **Step 6: Validate** — grep the brain again for `TAS-Brain`; expect zero live references (only the tombstone + archive path). Run `python "TITRIN\Claude\TAS - Tools\system_health.py"` → still green.

**Rollback:** `Move-Item` the folder back; revert the `CLAUDE.md` rows from git history.

---

## Phase 3 — Catch-up on a missed evening run (health check #7 + marker + instruction)

**Files:**
- Modify: `system_health.py` (imports + `STATE_DIR` + `check_brief_today()` + register it)
- Modify: runtime SKILL.md (stamp `last-end-of-day.json` at completion — STEP 7)
- Modify: `TITRIN\CLAUDE.md` (catch-up instruction)

- [ ] **Step 1: Add the marker write to the runtime SKILL.md (STEP 7)**

In `## STEP 7`, after confirming edits are saved, add:

```markdown
3. Stamp the run marker so the session-start health check knows the brief ran today:
   write `Claude/_state/last-end-of-day.json` = {"date":"<today YYYY-MM-DD>","status":"ok","delivery":"<inbox|draft>"} (native write).
```

- [ ] **Step 2: Add imports + constant to `system_health.py`**

At the top, change `from datetime import datetime, timezone` to include `timedelta`:

```python
from datetime import datetime, timezone, timedelta
```

Add near the other path constants (after line ~55):

```python
STATE_DIR = TITRIN / "Claude" / "_state"
```

- [ ] **Step 3: Add `check_brief_today()` to `system_health.py`**

```python
def check_brief_today() -> tuple[str, str, str]:
    """Nudge a catch-up when the weekday end-of-day/brief run was missed (Cowork was closed
    at 17:30). Compares the last-success marker against the most recent weekday 17:30 that has
    already passed, so it reads correctly in the evening, the next morning, and after a weekend.
    Silent until the feature is enabled (no marker yet) and on the day it ran."""
    marker = STATE_DIR / "last-end-of-day.json"
    if not marker.exists():
        return "morning brief", "PASS", "not yet enabled"
    now = datetime.now()
    expected = now.replace(hour=17, minute=30, second=0, microsecond=0)
    if now < expected:
        expected -= timedelta(days=1)
    while expected.weekday() > 4:           # back up to the most recent Mon-Fri
        expected -= timedelta(days=1)
    try:
        last = json.loads(marker.read_text(encoding="utf-8")).get("date")
    except (OSError, json.JSONDecodeError):
        last = None
    if last == expected.strftime("%Y-%m-%d"):
        return "morning brief", "PASS", f"ran {last}"
    return ("morning brief", "WARN",
            f"end-of-day/brief missing for {expected.strftime('%a %b %d')} — open Cowork and say "
            "'catch up end of day' to generate today's brief")
```

- [ ] **Step 4: Register the check** — in `main()`'s `checks = [...]` list, add `check_brief_today(),` (place it after `check_inbox_harvest()`).

- [ ] **Step 5: Add the catch-up instruction to `TITRIN\CLAUDE.md`**

Under the existing operations guidance, add one line:

```markdown
- **Missed brief catch-up (Cowork only):** if the session-start health check flags `morning brief … missing`, run the `end-of-day-update` workflow now (its SKILL at `Documents\Claude\Scheduled\end-of-day-update\`), then continue. The host pre-stages the day's attachments at 17:20, so a same-evening or next-morning catch-up still files them. (Run it in Cowork — that's where the task's Gmail/Calendar MCPs live.)
```

- [ ] **Step 6: Validate (host-side)**

```powershell
# Simulate a missed run:
'{"date":"2020-01-01","status":"ok"}' | Out-File -Encoding utf8 "C:\Users\Tish\Desktop\TITRIN\Claude\_state\last-end-of-day.json"
python "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\system_health.py"
# Expected: JSON with a 🟡 "morning brief: …missing…" line.

# Simulate today's run done:
$today = Get-Date -Format "yyyy-MM-dd"
"{`"date`":`"$today`",`"status`":`"ok`"}" | Out-File -Encoding utf8 "C:\Users\Tish\Desktop\TITRIN\Claude\_state\last-end-of-day.json"
python "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\system_health.py"
# Expected: silent on this check (PASS), assuming nothing else WARNs.
```

Then remove the simulated marker so it doesn't mask a real miss: `Remove-Item "...\_state\last-end-of-day.json"`.

**Rollback:** revert `system_health.py` (the check is additive — removing it disables the nudge); the marker file is harmless.

---

## Phase 4 — Bridge heartbeat fix (mount-proof `beats/`)

**Root cause:** the daemon rewrites one file (`bridge.alive`) in place every loop, but the Drive-mirrored mount does not propagate in-place rewrites into the Cowork sandbox — only NEW files cross. Existing corroboration uses `responses/` + `logs/`, which are empty on an idle daemon → false DOWN. Fix: emit a NEW beat file each interval.

**Files:**
- Modify: `TAS-Host-Bridge.py` (SUBDIRS, `beat()`, call in `watch()`)
- Modify: `system_health.py` (`check_bridge` liveness dirs)
- Modify: `bridge_client.py` (`heartbeat_age` liveness dirs)

- [ ] **Step 1: `TAS-Host-Bridge.py` — add `beats` to SUBDIRS** (line ~49):

```python
SUBDIRS = ("requests", "processing", "responses", "staging", "logs", "beats")
```

- [ ] **Step 2: Add beat constants + function** (near `HEARTBEAT`, line ~48):

```python
BEAT_EVERY_SEC = 60
BEAT_KEEP = 5


def beat(bridge: Path) -> None:
    """Mount-proof liveness: drop a NEW file each interval. The Cowork mount propagates new
    files into the sandbox reliably, unlike the in-place rewrite of bridge.alive — so this keeps
    an idle-but-alive daemon from reading as DOWN (the recurring false-DOWN). Host-pruned."""
    try:
        d = bridge / "beats"
        d.mkdir(parents=True, exist_ok=True)
        (d / f"beat-{int(time.time())}.txt").write_text(now_iso(), encoding="utf-8")
        for old in sorted(d.glob("beat-*.txt"))[:-BEAT_KEEP]:
            old.unlink(missing_ok=True)
    except OSError:
        pass
```

- [ ] **Step 3: Call `beat()` from `watch()`** — modify the loop (lines ~357-372):

```python
def watch(bridge: Path, interval: int = POLL_SECONDS) -> None:
    ensure_layout(bridge)
    log_line(bridge, "bridge watch started")
    last_cleanup = 0.0
    last_beat = 0.0
    actions = build_actions()
    while True:
        heartbeat(bridge)
        if time.time() - last_beat > BEAT_EVERY_SEC:
            beat(bridge)
            last_beat = time.time()
        try:
            run_once(bridge, actions)
        except Exception as exc:                    # noqa: BLE001
            log_line(bridge, f"loop error: {exc}")
        if time.time() - last_cleanup > 3600:
            cleanup(bridge)
            snapshot_active_projects()
            last_cleanup = time.time()
        time.sleep(interval)
```

- [ ] **Step 4: `system_health.py check_bridge` — add `beats`** (line ~230): change `for sub in ("responses", "logs"):` to:

```python
    for sub in ("responses", "logs", "beats"):
```

- [ ] **Step 5: `bridge_client.py heartbeat_age` — add `beats`** (line ~103): change `for sub in ("responses", "logs"):` to:

```python
    for sub in ("responses", "logs", "beats"):                                  # (2) new files
```

- [ ] **Step 6: Restart the daemon on the host + validate**

```powershell
Stop-ScheduledTask -TaskName TAS-Host-Bridge -ErrorAction SilentlyContinue
Start-ScheduledTask -TaskName TAS-Host-Bridge
Start-Sleep -Seconds 65
Get-ChildItem "C:\Users\Tish\Desktop\TITRIN\_bridge\beats"   # expect ≥1 beat-*.txt, < 65s old
python "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\bridge_client.py" status
# Expect: {"daemon":"alive","heartbeatAgeSec":<small>,...}
```

> **Cowork-side validation (cannot be done from host):** in the next Cowork session, run `python3 "Claude/TAS - Tools/bridge_client.py" status` after the daemon has been idle >10 min. It must read `alive`, not DOWN. Flag this as the real acceptance test (the false-DOWN only manifests through the sandbox mount).

**Rollback:** revert the three files; the `beats/` dir is harmless if orphaned. Daemon restart restores prior behavior.

---

## Phase 5 — Self-only inbox delivery (`notify.self` action + SKILL wiring + draft fallback)

**This is the only autonomous-send behavior change. It sends ONE email/day to Tish himself.** The recipient is hardcoded; the action cannot reach any other address.

**Files:**
- Modify: `TAS-Host-Bridge.py` (`SELF_ADDR`, `h_notify_self`, register in `build_actions`)
- Modify: `bridge_client.py` (`notify` subcommand)
- Modify: runtime SKILL.md (STEP 6C: send + fallback)
- Restart daemon (same restart as Phase 4 if done together)

- [ ] **Step 1: `TAS-Host-Bridge.py` — add the self-only handler** (after `h_send`, ~line 287):

```python
SELF_ADDR = "titrinsolutions@gmail.com"   # HARDCODED — notify.self can ONLY ever email Tish himself


def h_notify_self(params: dict, staging: Path) -> dict:
    """Send a self-notification (the morning brief) to Tish's OWN inbox. The recipient is
    hardcoded to SELF_ADDR and is NOT taken from params, so this channel is structurally
    incapable of reaching a client — it therefore does not weaken the gated, client-facing
    gmail.send guard. Reuses the proven Composer: draft to self (verbatim, no signature),
    then send that draft."""
    subject = params.get("subject") or "TAS Brief"
    draft_argv = [COMPOSER, "draft", "--to", SELF_ADDR, "--subject", subject]
    if params.get("bodyFile"):
        draft_argv += ["--body-file", params["bodyFile"]]
    else:
        draft_argv += ["--body", params.get("body", "")]
    drafted = run_tool(draft_argv)
    draft_id = drafted.get("draftId")
    if not draft_id:
        return {"result": {"ok": False, "stage": "draft", "detail": drafted}, "files": []}
    sent = run_tool([COMPOSER, "send", "--draft-id", draft_id, "--confirm"])
    return {"result": {"ok": bool(sent.get("ok")), "draftId": draft_id, "sent": sent}, "files": []}
```

- [ ] **Step 2: Register the action** in `build_actions()` (line ~342):

```python
        "notify.self": h_notify_self,
```

- [ ] **Step 3: `bridge_client.py` — add a `notify` subcommand**

Add the parser (near the other `sub.add_parser(...)` blocks, ~line 200):

```python
    p = sub.add_parser("notify", help="email the morning brief to Tish's own inbox (self-only)")
    p.add_argument("--subject", required=True)
    g2 = p.add_mutually_exclusive_group(required=True)
    g2.add_argument("--body"); g2.add_argument("--body-file")
```

Add the dispatch (near the other `if args.cmd == ...` blocks, before `raw`):

```python
    if args.cmd == "notify":
        params = {"subject": args.subject}
        if args.body_file:
            params["bodyFile"] = args.body_file
        else:
            params["body"] = args.body or ""
        return run("notify.self", params, args)
```

- [ ] **Step 4: Wire delivery into the runtime SKILL.md (new STEP 6C)**

Insert after STEP 6B, and in STEP 6 remove the interim "ALSO save to Gmail Drafts as before" line once this is live:

```markdown
## STEP 6C — Deliver the brief to Tish's inbox (self-only, with safe fallback)

Send the brief you wrote to `Claude/_state/brief-<date>.md` to Tish's own inbox via the self-only bridge channel:

  python3 "Claude/TAS - Tools/bridge_client.py" notify \
      --subject "TAS Brief · <Day Mon DD> · ▶ <the #1 TODAY action, trimmed to ~50 chars>" \
      --body-file "Claude/_state/brief-<date>.md"

Read the JSON result:
- exit 0 / `ok:true` → the brief is in the inbox. Set `delivery:"inbox"` in the STEP 7 marker.
- exit 3 (`pending`/daemon DOWN) or `ok:false` → the host bridge is down. FALL BACK: create the brief as a Gmail **draft** via the Gmail MCP (`create_draft`, subject as above, body = the brief), add a 🔴 ACT line "Bridge was down — brief left as a draft; check the host TAS-Host-Bridge task", and set `delivery:"draft"` in the marker. Never lose the brief.

(Recipient is hardcoded in the bridge to titrinsolutions@gmail.com — this step cannot email anyone but Tish.)
```

- [ ] **Step 5: Restart the daemon to load the new action**

```powershell
Stop-ScheduledTask -TaskName TAS-Host-Bridge -ErrorAction SilentlyContinue
Start-ScheduledTask -TaskName TAS-Host-Bridge
Start-Sleep -Seconds 5
```

- [ ] **Step 6: End-to-end test — REQUIRES TISH'S EXPLICIT OK (it sends a real email to his inbox)**

```powershell
'TAS BRIEF — TEST
▶ #1 TODAY: ignore — this is a delivery test.
🔴 ACT
 1. Delete this test email.' | Out-File -Encoding utf8 "C:\Users\Tish\Desktop\TITRIN\Claude\_state\brief-test.md"

python "C:\Users\Tish\Desktop\TITRIN\Claude\TAS - Tools\bridge_client.py" notify --subject "TAS Brief · TEST" --body-file "C:\Users\Tish\Desktop\TITRIN\Claude\_state\brief-test.md"
```

Then confirm via the Gmail MCP (`search_threads` for `subject:"TAS Brief · TEST" in:inbox`) that it arrived **in the inbox** (not Drafts). Delete the test. Remove `brief-test.md`.

> If Tish prefers, skip the live test and let the first real weekday 17:30 run be the validation (the draft fallback makes a bad first run non-destructive).

**Rollback:** remove `"notify.self"` from `build_actions()` + restart daemon (delivery reverts; STEP 6's interim Drafts path still produces the brief). Revert the SKILL STEP 6C.

---

## Out of scope (deliberately deferred — YAGNI)

- **Folding the Friday AR check + monthly revenue digests into the brief.** Nice consolidation (fewer stray Drafts), but it touches two more task SKILLs. Do it only if the daily brief proves out and the extra Drafts still annoy. Tracked, not built.
- **HTML-formatted brief.** v1 emails plain text (renders fine for a numbered list). Add an HTML body to the Composer's no-signature path only if the plain layout reads poorly on Tish's phone.
- **Moving brief generation off the app-open dependency entirely** (cloud routine). The catch-up (Phase 3) covers the miss case at far lower cost; revisit only if misses are frequent.

---

## Self-review

- **Spec coverage:** clean scannable brief (P1) ✓; ACT/FYI separation + FOLLOW-UP (P1, P3B) ✓; inbox delivery (P5) ✓; "back to Claude, do N" loop (`brief-context.json`, P1) ✓; catch-up on miss (P3) ✓; retire Obsidian (P2) ✓; heartbeat false-DOWN (P4) ✓; reuse the bridge, no new host task (P5) ✓; never auto-send to clients preserved (self-only hardcoded, P5) ✓.
- **Placeholder scan:** all code blocks are concrete and reference only symbols defined here or already in the read files (`COMPOSER`, `run_tool`, `now_iso`, `find_bridge`, `run`). The `<...>` tokens in SKILL.md prose are intentional fill-ins the LLM task computes at run time (date, item text), not code placeholders.
- **Type/interface consistency:** `notify.self` uses Composer `draft` (returns `draftId`, confirmed line 354) → `send --draft-id --confirm` (line 380) ✓. `bridge_client notify` submits action `"notify.self"` matching `build_actions()` ✓. `beats` added to liveness dirs in BOTH readers ✓. `check_brief_today` reads the same `last-end-of-day.json` the SKILL writes ✓.
- **Ordering:** P1 (prose, safe) → P2 (independent move) → P3 (catch-up) → P4 (heartbeat) → P5 (send; last, needs OK). P4+P5 share one daemon restart if executed together.
```
