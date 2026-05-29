# Fix: restore Cowork's "run Gmail like a human" capability (download/analyze/attach/file)

> Paste the block below into a NEW Claude Code session on the host. It diagnoses a recent
> regression, designs the fix (brainstorm + approval first), builds it host-side, and verifies in Cowork.
> Saved 2026-05-28.

---

You're in Claude Code on Tish Titina's (he/him) Windows host — owner of Titrin AgriSoil Solutions (TAS), a solo agrology consultancy he runs **primarily through Claude Cowork**. 

MISSION: restore and harden Cowork's ability to act like a human running his Gmail — **download email attachments, open/read/ANALYZE them, draft context-rich replies grounded in those documents, attach files to drafts, and file incoming reports/attachments into the correct TITRIN project folders.** This worked before and recently regressed: Cowork now drafts generic emails because it can't fetch or read the attached documents.

## STEP 1 — DIAGNOSE (confirm; don't assume)
Working hypothesis (verify it): Cowork now runs in a **Linux sandbox** that mounts ONLY `C:\Users\Tish\Desktop\TITRIN` (recent self-tests showed interpreter `/usr/bin/python3`, no `~/.tas/`, missing googleapiclient/shapely). On **2026-05-27**, OAuth creds were deliberately moved OUT of the Drive-synced tree — `TITRIN/Claude/.secrets/` → `~/.tas/` (host-only) — to stop a Google Drive credential leak (see `Claude/memory/feedback/feedback_secrets_outside_synced_tree.md`). Net effect: the Python Gmail tools (`TAS-Gmail-Downloader.py` = attachment bytes, `TAS-Gmail-Composer.py` = attach+draft) can no longer run in the sandbox (creds unreachable + packages absent), so Cowork falls back to the Gmail **MCP**, which reads/drafts text but **cannot move attachment bytes**. That's the regression.

Confirm precisely:
- Is Cowork actually sandboxed (Linux, TITRIN-only, no `~/.tas/`) today? Note: `feedback_primary_workflow.md` claims Cowork runs with FULL host filesystem + Python access — the self-tests contradict that. Resolve the contradiction: what is Cowork's real execution environment now, and did it change recently?
- Is "full host access vs sandbox" a Cowork **setting/mode** that can be toggled? If Cowork can run with full host access, `~/.tas/` becomes reachable and the host Python (which HAS googleapiclient) works → the existing tools work again on-demand, like before. **Investigate this FIRST — the cleanest fix may be a setting, not a build.**
- Confirm timeline: did the break coincide with the 2026-05-27 creds move, a Cowork update, or both?

## HARD CONSTRAINTS
- OAuth creds must NEVER sit in the Drive-synced TITRIN tree (that was the leak). Keep them at `~/.tas/<service>/`.
- The Gmail/Calendar connector MCPs cannot transfer attachment bytes (no download, no attach) — text only.
- The sandbox (if that's the mode) can't reach `~/.tas/` or install packages.

## STEP 2 — DESIGN (brainstorm, present a plan, get Tish's approval before building infra). Pick/combine after diagnosis:
(a) **Restore Cowork full host access** — simplest if it's a toggle; re-enables creds + host python so existing tools work on-demand. Verify it does NOT reintroduce the Drive leak.
(b) **Junction trick** (logged in CANDIDATE-EDITS): make `TITRIN/Claude/.secrets` a directory junction → `~/.tas`. IF Google Drive Desktop does NOT sync junction targets (no leak) AND the Cowork mount DOES traverse it (creds become sandbox-reachable), this restores in-sandbox creds safely. Test BOTH halves with a dummy file first. (Also needs googleapiclient reachable in the sandbox python — test.)
(c) **Host↔sandbox bridge (durable; keeps creds host-only)** — a shared request/response area inside TITRIN. INBOUND: Cowork writes `_inbox-requests/<id>.json` ("fetch attachments for thread/query X") → a HOST watcher (a frequent Windows Task ~1–2 min, or a small host daemon) runs `TAS-Gmail-Downloader.py` and drops files + manifest into `_inbox-staging/<id>/` → Cowork reads/analyzes/files them. OUTBOUND: Cowork stages `_outbox/<id>.json` (body + attachment paths + to/cc/subject/threadId) → the watcher runs `TAS-Gmail-Composer.py` to create the draft WITH attachments, UNSENT → Tish reviews + sends. This generalizes the existing scheduled `TAS-Inbox-Harvest` host-prefetch into on-demand request/response + adds the outbound path. Creds stay host-only; Cowork gets full attachment capability with ~1–2 min latency.

Recommendation: (a) if it's a genuine toggle; otherwise (c) is the durable answer. (b) only if both the Drive-skip and mount-traverse tests pass.

## STEP 3 — BUILD + TEST END-TO-END IN COWORK (not just host). Acceptance test, from a real Cowork session on a real recent thread: Cowork can (1) pull a specific email's PDF attachment, (2) open + read + ANALYZE its contents, (3) file it into the correct `TAS - Projects/Active/<file#>/…` typed subfolder, (4) draft a reply that reflects the document's actual contents, and (5) stage an outbound draft WITH a PDF attachment that lands in Gmail Drafts (unsent).

## STEP 4 — DOCUMENT + SELF-HEAL. Update `gmail-workflow.md`, `reference_tas_scripts_host_only.md`, the email-responder / project-lead / tas-report-writer skills, and `automation_and_scheduled_tasks.md` so future sessions use the new path by default. Add a `system_health.py` session-start check that flags if the bridge/watcher is down or a request is stuck. Log the outcome in `CANDIDATE-EDITS.md`.

## GUARDRAILS
- Tish is **he/him** (just fixed across the brain — keep it that way).
- Revenue + Cowork-first lens; this is his core daily workflow, so reliability matters most.
- READ FIRST: `Claude/CANDIDATE-EDITS.md`, `Claude/memory/reference_tas_scripts_host_only.md`, `Claude/memory/gmail-workflow.md`, `Claude/memory/feedback/feedback_primary_workflow.md`, `Claude/memory/feedback/feedback_secrets_outside_synced_tree.md`, `Claude/memory/automation_and_scheduled_tasks.md`, plus the existing `TAS-Inbox-Harvest.py` / `TAS-Gmail-Downloader.py` / `TAS-Gmail-Composer.py`.
- Build host-side (Claude Code) where creds + packages live; VERIFY in Cowork.
- Brainstorm + present the plan for approval before building any new watcher/daemon/task.
