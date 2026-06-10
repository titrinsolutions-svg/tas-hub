# Design Spec — Cowork ⇄ Host Action Bridge

**Date:** 2026-05-28
**Author:** Claude Code (host session) for Tish Titina, P.Ag. — Titrin AgriSoil Solutions Ltd.
**Status:** Draft for Tish's review (rev 2 — adds gated send, signature fidelity, access model, architecture placement)
**Goal owner's words:** *"a future-proof permanent full-access system to my Gmail and anything Claude Cowork may need, like a human… open attachments, analyse them, read them, download them, save them in the TITRIN folders or anywhere else appropriate… give non-generic replies with full context… I will review and send every email, drafts are good enough unless I specifically tell you to send… I'd love Claude Code and Cowork to have full access to my computer… a solid foundation to infinitely build upon without errors."*

---

## 1. Purpose & goal

Give Claude **Cowork** human-equivalent reach for running TAS, despite Cowork executing inside a locked sandbox. Cowork must be able to: fetch and **read/analyze email attachments**, download Drive files, **file documents** into the right folders (in TITRIN *or anywhere on the host*), **draft context-rich replies** carrying the proper **logo sign-off + attachments**, and — **only when Tish explicitly says so** — **send** an email or an existing draft. Permanent, self-healing, efficient, extensible to "anything Cowork may need" without re-architecting.

## 2. Diagnosis this design is built on (confirmed 2026-05-28)

- **Cowork runs in a mandatory Hyper-V Linux sandbox** that VirtioFS-mounts only the selected folder (`C:\Users\Tish\Desktop\TITRIN`). HOME is `/sessions/<id>/`; the Windows home — including `~/.tas/` creds — and Windows Python packages are **unreachable by design**. No reliable toggle gives Cowork full host access (`sandbox.enabled=false` not honored in Cowork on Windows). → Mission option (a) is out.
- **Root cause of the regression:** the 2026-05-27 move of OAuth creds out of the Drive-synced tree (`Claude/.secrets/` → `~/.tas/`, correct, to stop a Drive leak) put creds outside the only folder Cowork can see. The Python Gmail tools can no longer run in Cowork; it falls back to the Gmail MCP, which handles **text** but cannot move attachment **bytes**.
- **Host path is fully alive** (proven): host python 3.14.3 + all Google packages; live `auth-check` → `ok / titrinsolutions@gmail.com / tokenValid:true`.
- **True gap:** on-demand, interactive host capability driven from a live Cowork session (inbound bytes + faithful signed drafts). Daily auto-filing already works via the scheduled `TAS-Inbox-Harvest`.

## 3. Governing principle

> **Cowork is the brain (sandbox); a host helper is the hands (full access); the mounted TITRIN folder is the nervous system between them.**

We don't fight the sandbox. Cowork drives a host-side executor through the one channel they reliably share — the mount. No ports, no creds crossing the boundary.

```
   COWORK (sandbox = brain)            TITRIN mount (transport)             HOST (hands = full access, ~/.tas creds)
   reads/analyzes/decides   ──write──▶  _bridge/requests/<id>.json   ──▶   TAS-Host-Bridge daemon (watches)
                                        + <id>.ready  (marker)               │ dispatch → action handler (whitelist)
   reads response + files   ◀─read───   _bridge/responses/<id>.json  ◀──     │ runs TAS-Gmail-Downloader / Composer
   files within the mount   ◀─read───   _bridge/staging/<id>/…        ◀──     └ writes results + cleans up + heartbeat
```

## 4. Access model — what Claude Code vs Cowork can reach (and how we widen it)

| | Claude Code (this session type) | Cowork (sandbox) |
|---|---|---|
| **Filesystem** | **Full host already** — read/write anywhere, today. Nothing to build. | Only mounted folders. **Widen by granting more folders in Cowork's UI** (Downloads, the whole user folder, etc.) — Tish-side, documented in §13. |
| **Run host commands / tools** | **Full already** (PowerShell/Bash). | Via the **bridge** `tool.run` (named whitelist) — extensible to any specific program/workflow on request. |
| **Gmail attachment bytes / send / Drive** | Full (host python + `~/.tas`). | Via the **bridge** Gmail actions. |
| **Visually operate GUI apps** | Not its job. | **Not this bridge** — that's the separate `computer-use` capability. The bridge drives anything with a file/CLI/API interface, not pixels. |

**Honest boundary:** "full human-like access" for Cowork = bridge (host actions) + folder grants (direct files). True unrestricted arbitrary execution is deliberately **not** the default — see §9.

## 5. The bridge protocol (the foundation — designed to outlast every handler)

### 5.1 Folder layout (under TITRIN, gitignored)
```
_bridge/
  requests/      Cowork writes <id>.json, then <id>.ready
  processing/    daemon moves a claimed request here (host-only)
  responses/     daemon writes <id>.json (the signal Cowork polls for)
  staging/<id>/  fetched files land here (Cowork reads; mount-relative)
  logs/          daemon log (rotated)
  bridge.alive   heartbeat: daemon rewrites ISO timestamp every ~20s
```

### 5.2 Request — `_bridge/requests/<id>.json`
```json
{
  "v": 1,
  "id": "20260528-153012-a1b2",
  "action": "gmail.harvest",
  "params": { "...": "action-specific" },
  "requestedBy": "project-lead",
  "ts": "2026-05-28T15:30:12-07:00"
}
```
**Half-write safety (Cowork can create but NOT delete on the mount):** Cowork writes `<id>.json` fully, then an empty `<id>.ready`. The daemon only claims requests that have a `.ready` marker, so it never reads a partial file — no rename/delete needed by Cowork.

### 5.3 Response — `_bridge/responses/<id>.json`
```json
{
  "v": 1, "id": "…", "action": "…",
  "ok": true,
  "result": { "…": "action summary" },
  "files": ["_bridge/staging/<id>/_email_attachments/foo.pdf"],
  "startedAt": "…", "finishedAt": "…",
  "error": null
}
```

### 5.4 Lifecycle
1. Cowork writes request + `.ready`; polls `responses/<id>.json` every ~2 s (timeout ~120 s).
2. Daemon sees `.ready` → moves request to `processing/` (atomic claim) → validates action against whitelist → runs handler.
3. Daemon writes staged files + `responses/<id>.json`, then removes `.ready`/processing entries (host can delete).
4. **Retention (host-only):** daemon deletes responses + `staging/<id>` older than 48 h (matches the harvester's 2-day window). Files Cowork already filed into a project folder are untouched — staging is a scratch hand-off, not the system of record.

## 6. Components (each small, single-purpose, independently testable)

| Unit | Responsibility | Interface | Depends on |
|---|---|---|---|
| **`TAS-Host-Bridge.py`** (new) | Daemon: watch, claim, dispatch, respond, clean up, heartbeat | `watch` (daemon) / `run-once` (drain + exit; for tests + scheduled fallback) | stdlib only; shells out to existing tools |
| **action handlers** | One function per whitelisted action; thin wrappers over proven tools | `handle(params) → {result, files}` | Downloader, Composer, Project-Filer, `tas_gmail_auth` |
| **Cowork calling convention** | How a skill issues a request + polls | documented helper snippet (write json + `.ready`, poll) | mount only |
| **autostart** | Keep the daemon running as Tish | Task Scheduler `TAS-Host-Bridge`, *At log on* + restart-on-failure | host |
| **health hook** | Surface bridge down / stuck request at session start | extend `system_health.py` | `bridge.alive`, request age |

## 7. Whitelisted action set (v1)

| Action | Wraps | Params | Returns / notes |
|---|---|---|---|
| `gmail.harvest` | Downloader `harvest` | `query, outDir?(=staging/<id>), max?, bodies?, drive?` | manifest + `files[]` |
| `gmail.download` | Downloader `download` | `messageId, attachmentId, filename, inline?` | file in staging, or base64 in `result` when `inline:true` |
| `gmail.drive` | Downloader `drive` | `fileId, outDir?` | file in staging |
| `gmail.draft` | Composer `draft` | `to, subject, body|bodyFile, attach?[], threadId?, cc?, bcc?, signature?(default **true**)` | `draftId` — **never sends** |
| `gmail.send` | Composer/Gmail send | `draftId` **or** full message; `confirm:true` **required** | **gated** — see §9. Sends a draft or message **only on Tish's explicit instruction** |
| `file.place` | host copy | `srcMountPath, destHostPath, overwrite?(=false)` | dest path — *"save anywhere appropriate"* |
| `tool.run` | named host tool | `tool (whitelist: project-filer, calendar-sync), args[]` | tool JSON — the extensibility seam |

Unknown action → rejected + logged. New capability = a new handler, same protocol, no new infra.

## 8. Outbound fidelity — signed drafts that match Tish's real sign-off (Problem 2)

- Tish's active Gmail signature is **"TAS Sign V3 PAg"**: the TITRIN logo + contact block (*Tish Titina · Principal · P.Ag., MSc · C: 778-885-…*) + an italic **confidentiality footer**. Gmail inserts it in the web composer; **API-created drafts do not get it automatically** — which is why Cowork's drafts come out bare and Tish re-pastes.
- **Approach (faithful, not approximate):** during the build, **extract the exact V3 signature HTML from a recent sent email**, save it as a reusable template (e.g. `TAS - Branding & Templates/Email Signoff/signature-v3.html`) with the logo as an inline `cid:` image. The Composer's `--signature` is upgraded to inject this template, so a drafted reply is byte-for-byte what Tish sends by hand — logo, contact block, and confidentiality footer included.
- **Canonical drafting path for client email = `gmail.draft` via the Composer, signature on by default.** Quick internal notes can opt out. Preserves the one-tool-per-thread rule (Composer end-to-end on client threads; MCP only for unsigned quick notes).
- **Skill wiring:** `email-responder`, `project-lead`, `tas-report-writer` (+ operator hats that draft) updated to stage a `gmail.draft` request with `signature:true` instead of calling the MCP directly for client drafts.

## 9. Security & safety model

- **Whitelist only** — unknown/forbidden actions rejected; no `shell=True`; args passed as lists. New programs are added to the whitelist explicitly, on request — **not** a blanket "run anything" mode (anything that can write the Drive-synced mount could otherwise run code as Tish). *Recommended default; Tish can opt into a wider mode knowingly.*
- **Send is gated, never autonomous.** `gmail.send` runs **only** when (a) Tish explicitly instructs a send in-conversation, and (b) the request carries `confirm:true`. Claude never issues a send speculatively. Default for everything Claude generates remains **draft, unsent**. (Aligns with "I'll review and send every email… unless I specifically tell you to send.")
- **Send scope:** `users.drafts.send` / `messages.send` are authorized by the existing `gmail.modify` scope (to be **verified** in the build) — expected **no re-auth**. If verification fails, sending stays disabled until Tish approves a one-time re-consent.
- **Creds stay host-only** at `~/.tas/`; requests/responses never carry secrets; nothing re-enters TITRIN (2026-05-27 leak fix preserved). `.gitignore` gets `_bridge/`.
- **`file.place` guardrails** — src under the mount; no overwrite unless `overwrite:true`; Windows/system dirs blocked; every placement logged.
- **Trust boundary = the mount.** On Tish's single-user machine (Drive cap = 1) this is acceptable for v1; a per-request shared-secret can be added later if the threat model changes (YAGNI now).
- **Auditable** — every action logged with id, action, requestedBy, result.

## 10. Reliability, health & efficiency (first-class)

- **Efficient:** stdlib-only daemon, ~2 s poll of a tiny folder (no extra dependency, no busy-spin). Idle cost negligible.
- **Self-starting & self-healing:** Task Scheduler `TAS-Host-Bridge`, *At log on* (+ *At startup* best-effort), **restart-on-failure** every 1 min. Mirrors `TAS-Inbox-Harvest`/`TAS-Git-Backup`.
- **Heartbeat + watchdog:** daemon rewrites `_bridge/bridge.alive` every ~20 s; `system_health.py` WARNs at session start if it's stale or a request has sat unprocessed > ~5 min.
- **Backstop:** the nightly `TAS-Inbox-Harvest` keeps working independently; `run-once` lets a plain scheduled task drain the queue if the daemon is ever disabled.

## 11. Acceptance test = data-flow walkthrough (the mission's 5 steps + send)

From a **live Cowork session** on a real recent thread:
1. **Pull** — Cowork requests `gmail.harvest`/`gmail.download` → daemon downloads the PDF into `staging/<id>/`.
2. **Analyze** — Cowork reads the staged PDF (multimodal Read).
3. **File** — Cowork files it into `TAS - Projects/Active/<file#>/…` via Project-Filer / `file.place`.
4. **Reply** — Cowork drafts a reply grounded in the document's actual contents.
5. **Signed draft w/ attachment** — `gmail.draft` (signature default) attaching the PDF → Gmail **Drafts, unsent**, V3 sign-off intact.
6. **Send (only on explicit say-so)** — when Tish says "send it," `gmail.send confirm:true` sends that draft.

## 12. Testing strategy

- **Host (Claude Code, me):** `run-once` per action; response shape; files present; draft created + signature present (then delete test draft); **send-scope check without actually sending**; malformed/unknown-action rejection; half-write safety; cleanup/retention; heartbeat freshness.
- **Cowork end-to-end (Tish-driven):** the §11 acceptance test from a real Cowork session — the only part I can't run. I'll hand Tish an exact copy-paste script.

## 13. Architectural placement (keep it tidy — addresses "is my setup optimal / TITRIN is messy")

Every new artifact has one obvious home, following existing conventions:

| Artifact | Lands at | Why |
|---|---|---|
| `TAS-Host-Bridge.py` | `TITRIN/Claude/TAS - Tools/` | with every other TAS tool |
| signature template | `TITRIN/TAS - Branding & Templates/Email Signoff/signature-v3.html` | with the branding assets |
| runtime `_bridge/` | `TITRIN/_bridge/` (gitignored) | beside `_inbox-staging/`; transient client data |
| health check | extend `TITRIN/Claude/TAS - Tools/system_health.py` | existing session-start surface |
| autostart task | Windows Task Scheduler `TAS-Host-Bridge` | beside `TAS-Inbox-Harvest`/`TAS-Git-Backup` |
| operational runbook + capability routing | update `gmail-workflow.md`, `reference_tas_scripts_host_only.md`, `automation_and_scheduled_tasks.md`, `ARCHITECTURE.md` | the brain Cowork reads |
| skill wiring | `email-responder` / `project-lead` / `tas-report-writer` SKILL.md | where drafting happens |
| stale-fact fixes | `feedback_primary_workflow.md`, `feedback_secrets_outside_synced_tree.md` (drop "full host access" claim) | correctness |
| this spec | `tas-hub/docs/superpowers/specs/` | the build's design record |

**Follow-on (separate effort, not this build):** a dedicated pass to (a) tidy the TITRIN folder and (b) sanity-check the whole Claude setup for optimization — using the existing `tas-hub/audits/full-architecture-review.md` prompt. Tracked as a task; offered after the bridge ships so it doesn't delay the revenue-critical fix.

## 14. Extensibility / future-proofing

- New host capability = a new whitelisted handler (≤ a few lines). Protocol, daemon, autostart, health unchanged.
- **Upgrade path (Approach B, later, optional):** if a future test shows the sandbox can reach a host port, re-expose the same handlers as a host-local **MCP server** (native Cowork tools, near-instant, no polling). File-bridge remains the guaranteed fallback. Pending a live-Cowork reachability test.
- Possible later unification: fold `TAS-Inbox-Harvest`/`TAS-Report-Harvest` into `run-once`/`tool.run` for one host execution surface.

## 15. Out of scope (YAGNI for v1)

- Host-local MCP server (Approach B) — deferred pending reachability test.
- **Blanket arbitrary command execution** from Cowork — deliberately not the default (whitelist instead); opt-in only if Tish knowingly chooses it.
- Autonomous sending — never (send is explicit-instruction + `confirm:true` only).
- GUI app automation (computer-use) — a different capability, not this bridge.
- Full TITRIN reorg / Claude-setup optimization — a separate, tracked follow-on.
- Per-request auth token — deferred (mount is the trust boundary on a single-user machine).

## 16. Defaults chosen (confirm at review)

1. **Responsiveness:** persistent daemon (~seconds), autostart at logon, restart-on-failure — *approved 2026-05-28*.
2. **Signed-by-default** client drafts via the Composer path, reproducing the exact V3 sign-off (logo + contact + confidentiality footer) extracted from a real sent email.
3. **Send:** gated `gmail.send` — explicit instruction + `confirm:true` only; never autonomous.
4. **Access posture:** Claude Code already full-host; Cowork via bridge + Tish granting more folders; `tool.run` whitelist (extensible), no blanket exec by default.
5. **Bridge home:** `TITRIN/_bridge/` (gitignored).
6. **`file.place` targets:** anywhere under the user profile + data drives, no-overwrite default, system dirs blocked.
7. **Follow-on architecture/tidy pass** tracked separately, offered after the bridge ships.
