# Field Dispatcher — Design Blueprint (PARKED)

- **Date:** 2026-06-02
- **Owner:** Tish Titina, TAS
- **Status:** 🅿️ **PARKED — do not build yet.** Foundation-only now; build when a trigger below fires.
- **Why this doc exists:** Capture the full design + "build-it-when" triggers so that when Anthropic ships the missing primitive, a future session starts from a finished blueprint instead of scratch.
- **2026-07-02 trigger review (delegated by Tish):** the Jul-1 self-audit flagged trigger #2 as plausibly fired
  (native subagent fan-out / dynamic workflows). Reviewed: those primitives shipped in **Claude Code** (agent
  teams + the Workflow tool — proven by the 2026-07-02 26-agent system review), **not inside Cowork Dispatch**,
  and the triggers below require them on the Dispatch channel — so the trigger only PARTIALLY fired.
  **Ruling: stays parked.** Sharpened triggers: (a) fan-out/decomposition primitives land inside Dispatch/Cowork,
  OR the scheduled tier completes its Code migration (platform verdict 2026-07-02) making a Code-side dispatcher
  the coherent home; (b) a live coordinator field workflow demands routed dispatch (field capture is shifting to
  Tish's coordinators — the revenue case). The no-regret core below is unchanged and remains the priority.

---

## The goal (Tish's words)

> Make my Claude (Code + Cowork) feel as human as possible — I give updates, ask for things to get done, or drop **multiple tasks and updates for multiple projects all in one chat**, and it **distributes the work to the right channel**, holds **all the context**, and doesn't get **bogged down or missing steps**. Both *ask* and *act*.

In one line: **a brain-dump front door that decomposes, routes to the right skill, runs each task cleanly, drops nothing, and reports back — reachable from the field.**

---

## Decision & rationale (why parked, not built)

- **The channel already exists** (see below) — no need to build it.
- **The live-partner UX is a moving target Anthropic is actively shipping** (Dispatch, Remote Control, Cowork are all only months old as of 2026-06). Building a custom orchestrator/messaging gateway now risks being obsoleted by a native feature. Wait for the platform.
- **Hermes Agent was evaluated and declined** — it's a parallel re-implementation of this exact stack with a host-level security model unsafe for a sensitive-data box. See memory `reference_hermes_agent_eval`.
- **What's worth doing now is the *foundation*, not the build** — see "No-regret core."

---

## Architecture blueprint

### 1. Channel layer — ALREADY EXISTS (zero build)
Confirmed via Anthropic docs (2026-06):
- **Cowork Dispatch** — fire a task from the Claude phone app → spins up a Cowork session **on the PC** (local files, skills, MCP), runs **async while phone away/asleep**, **push-notifies when done**. One persistent thread. → *the "brain-dump from the field, come back to finished work" surface.*
- **Remote Control** (`claude remote-control` + QR) — **steer a live session from the phone** in real time, same context. → *the "talk to it like a human, live" surface.*
- **Trust boundary:** runs on the PC under the Max plan — same Anthropic boundary already in use, **no new third-party vendor**.
- **Constraints that shape the design:**
  - PC must stay **awake + online** (set a keep-awake power setting).
  - Field signal: Remote Control drops after ~10 min offline → **Dispatch (async + push) is the field-reliable one**; Remote Control is desk/good-signal.
  - **Dispatch is one long thread** → the source of the "quality degrades / misses steps" worry. This is the core problem the dispatcher brain solves.

### 2. Dispatcher brain — THE THING TO BUILD (when triggered)
**Pattern: thin coordinator + isolated workers + a ledger.** The long Dispatch thread becomes *intake + routing + tracking only* — never the place work is done.
1. **Intake** a multi-project brain-dump.
2. **Decompose** into discrete work-items (one per task/project).
3. **Route** each item to the right skill (substrate below).
4. **Execute each in an isolated worker** (fresh context) so the main thread never bloats — this is what prevents "bogged down / missing steps."
5. **Ledger** every item + status (the proof that nothing was dropped).
6. **Reconcile + report** back in one consolidated reply.

### 3. Routing substrate — MOSTLY EXISTS
Route to Tish's existing skills; `tas-operator-router` already does *plain-English-in → route-to-the-right-hat*. Extend that pattern to the full set:
- Status/lookups → `morning-brief`, `project-runner`, `money-manager`
- Acts → `tas-report-writer`, `tas-invoice-generator` (via the one correct script), `email-responder`, `tas-kickoff`, `project-lead`
- Growth → `business-development`, `growth-and-web`

### 4. Autonomy boundary — act vs. stage
Consistent with existing guardrails (drafts never sent; invoice only via `TAS-Invoice-Generator.py`; ask before publish/deploy/send):
- **Act autonomously** on *reversible* work: drafts, research, file/status updates, project reads.
- **Stage for one-tap approval** on *irreversible / outward* actions: sending email, finalizing/sending an invoice, publishing, deploying. From the field, "approve" should be a single tap on the phone.

### 5. State/context foundation — THE FOUNDATION (no-regret)
Single authoritative source for project status. Today it's split (`constants.ts` in tas-hub + `active-projects.md` in TITRIN; portal reads stale compiled constants). Make `active-projects.md` (auto-updated weekdays by `end-of-day-update`) canonical, and have the portal read it via `GET /api/hub`. **No agent — present or future — can run the business reliably on a split source of truth.**

---

## No-regret core (safe to do anytime, independent value)

These pay off **regardless of whether the dispatcher is ever built**, and they make *today's* Dispatch better too:
1. **Single source of truth for project status** (portal → `GET /api/hub`; already on the backlog). Highest leverage.
2. **Crisp skill boundaries** — each skill does one thing with a clear trigger, so routing is unambiguous.
3. **Thread hygiene habit** — start a fresh Dispatch thread per work-batch; don't let one thread accumulate weeks of unrelated projects.

> Principle: the limiter on "Claude running the business like a partner" was never Claude's capability — it's whether *the business's context is in a shape an agent can act on.* Fix that now; plug in the partner when it arrives.

---

## Build-it-when triggers (the watch list)

Build the dispatcher **optimally** when any of these fires:
- **[Platform] Project-scoped / multi-thread Dispatch** — separate persistent contexts per project. Directly kills the one-long-thread degradation; biggest single signal.
- **[Platform] Native task decomposition / background subagent fan-out** inside Dispatch or Cowork.
- **[Platform] Persistent/named agents or "agent teams"** in Cowork (autonomous workers you can route to).
- **[Platform] Scheduled/triggered autonomous agents or hooks in Cowork** (a received dispatch can auto-route).
- **[Platform] Reliability upgrades** — Dispatch offline resilience / wake-on-demand (removes the "PC must stay awake" fragility) / longer Remote Control timeouts.
- **[Pain] A real incident** — multi-project juggling causes a missed step or deadline. Pain beats theory; build then regardless of platform.

A monthly watch routine checks Anthropic's release notes against this list and pings Tish on a hit. Tish can also trigger a build review manually anytime.

---

## Build sequence (when a trigger fires)

1. Identify which trigger fired + the new primitive; re-read this blueprint.
2. Confirm the **no-regret foundation** is done (single source of truth for project status).
3. Build the **thin dispatcher** (intake → decompose → route → isolated worker → ledger → reconcile), mapping "isolated worker" onto the best primitive then available (subagents/workflows today; native agent workers if shipped).
4. Wire the **autonomy boundary** (act reversible / stage irreversible).
5. Test with a **real multi-project brain-dump**; the ledger is the proof nothing dropped.
6. Connect via the **best channel** then available (Dispatch / Remote Control / successor).

---

## Open questions (deferred until build)

- Routing taxonomy: exact intent → skill map.
- Ledger format + where it persists (`noteJournal`? a tasks store? Netlify Blob?).
- How "stage for approval" is surfaced for one-tap phone approval.
- Whether the dispatcher is a **skill**, a **workflow**, or a **native agent** — depends on what's shipped at build time.

## Pointers
- Hermes evaluation & decline: memory `reference_hermes_agent_eval`
- Backend (Netlify Functions + Blobs; `/api/hub`, `/api/field-submissions`, `/api/hub/notes`): memory `project_backend`
- Field → report architecture: memory `architecture_field_to_report`
- Project-status split friction: tas-hub `CLAUDE.md` ("projects maintained in TWO places")
