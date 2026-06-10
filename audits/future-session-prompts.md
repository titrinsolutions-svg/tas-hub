# Future-session prompts — paste-ready

Self-contained prompts to start a NEW Claude Code (or Cowork) session for the next pieces of work.
Each stands alone (a fresh session has no memory of the bridge build). Saved 2026-05-29 after the
Cowork⇄host Gmail bridge shipped. Recurring audits already exist in this folder
(`monthly-self-audit.md`, `weekly-health-check.md`); these are the specific follow-ons.

---

## 1 — Weekly bridge + OAuth health check  (run weekly, or after any "Cowork can't fetch attachments")
```
You're in Claude Code on Tish Titina's Windows host (he/him), owner of Titrin AgriSoil Solutions.
The Cowork⇄host Gmail bridge (TAS-Host-Bridge daemon) was deployed 2026-05-29. Read
Claude/memory/workflows/cowork-host-bridge-runbook.md first, then verify it's healthy:
1) python "Claude/TAS - Tools/TAS-Host-Bridge.py" status  → heartbeat should be fresh (<1 min).
2) Get-ScheduledTask TAS-Host-Bridge  → State Running.
3) Scan _bridge/logs/ + _bridge/requests/ for failed or stuck requests.
4) Run system_health.py → bridge, OAuth-freshness, and branding checks should be green.
5) If the weekly OAuth token is near expiry, run: python "Claude/TAS - Tools/TAS-Reauth.py" run (host).
Report status and fix anything that's down. If Cowork wanted any new bridge actions during the week,
propose adding them as whitelisted handlers (don't add arbitrary command execution).
```

## 2 — Claude credential + plugin hygiene (done the RIGHT way, not by hand-editing)
```
Claude Code on Tish's Windows host. Clean up the Claude-config hygiene items from the 2026-05-28
setup audit (tas-hub/docs/architecture/2026-05-28-claude-setup-audit.md) WITHOUT hand-editing
Claude-managed files — blocklist.json / .credentials.json get auto-refetched, so manual edits don't
stick and a bad edit can break live connector auth. Use Claude Code's own plugin/connector controls:
1) Uninstall the 5 disabled, unused plugins (atomic-agents, gitlab, vercel, mcp-server-dev,
   learning-output-style) via the plugin manager.
2) Review the ~40 MCP OAuth entries (0 active tokens) and remove connectors you don't use, via the
   connector UI.
3) Decide if the Figma/Egnyte plugins are needed; if not, remove them (their client secrets sit in
   .credentials.json).
Verify each change via the proper command. Do NOT break any active connector (Gmail, Calendar, Drive,
Firebase, Netlify).
```

## 3 — Reference Library dedup + Project Tracker decision (careful, propose-first)
```
Claude Code on Tish's host. Per the 2026-05-28 setup audit: TAS - Reference Library/Madrone
Environmental/ has multiple versions of the same reports (LCA v1+v2, same-date Closure reports, FQA
variants) with no version index — risk of citing a superseded version.
1) For each report TYPE, identify the latest version (judgment call from dates/revisions) — PROPOSE
   before moving anything.
2) Move older versions to a _superseded/ subfolder with a MANIFEST.
3) Create/refresh a VERSION_INDEX.md naming the current version of each external report.
Also: TAS - Project Tracker.xlsx (TITRIN root) is stale (March; superseded by active-projects.md) and
read by no tool — decide delete vs keep as a historical snapshot.
Propose-first; never delete report files without Tish's confirmation.
```

## 4 — Wire the bridge into the drafting skills (optional reinforcement)
```
Claude Code on Tish's host. The Cowork⇄host bridge (runbook:
Claude/memory/workflows/cowork-host-bridge-runbook.md) lets Cowork create signed client drafts via a
gmail.draft request. The routing lives in gmail-workflow.md, but the drafting SKILLs don't name it
explicitly. Update email-responder, project-lead, and tas-report-writer SKILL.md (in
Claude/.claude/skills/) so that for CLIENT-facing emails they stage a bridge gmail.draft request
(signature on by default → exact V3 sign-off + attachments, lands UNSENT) instead of the bare Gmail
MCP. Keep the Gmail MCP for quick text-only internal notes. Preserve one-tool-per-thread. Test by
having a skill draft a client reply and confirming a signed draft lands unsent. Don't change other
skill behavior.
```

## 5 — Full-system re-evaluation (hand to a next-generation frontier model)
Paste this when a materially more capable model arrives, running agentically in Claude Code / Cowork (or successor) with read access to the system. Stamp the model + date at the bottom first.
```
<role>
You are the principal systems architect and business-operations strategist for Titrin AgriSoil Solutions (TAS) — a one-person, revenue-generating regulated agrology consultancy owned by Tish Titina, P.Ag. (he/him), in Richmond BC. Re-architect the entire AI-operated system that runs this business so it operates as much like a sharp human partner as possible, at maximum efficiency and the highest output quality — without breaking what already works or what earns revenue.
You are a far more capable model than the one that built the current system. Use that. Do NOT defer to the previous model's conclusions or anchor on its parked decisions — re-derive from primary evidence and challenge anything that no longer holds given your greater capability and whatever has changed since 2026-06.
Operate in PROPOSE-ONLY mode: deliver a plan; make NO changes to code, data, scheduled tasks, secrets, or deployments until Tish approves.
</role>

<binding_principles>
- Honest tradeoffs over agreeableness — challenge Tish, never flatter.
- The business bottleneck is lead flow, conversion, and delivery throughput — NOT code quality. Apply this revenue lens to every recommendation: does it acquire, retain, or serve a client? If not, deprioritize and say so.
- Preserve what works; never propose churn that doesn't clearly earn its cost.
- Never compromise the determinism of the invoice and regulatory-report pipelines, or the security posture (sensitive client data; secrets stay outside the Drive-synced tree).
</binding_principles>

<read_first>
Map the real current state before concluding anything (read-only); cite what you actually read:
1. tas-hub/CLAUDE.md and C:\Users\Tish\Desktop\TITRIN\CLAUDE.md
2. TITRIN Claude/ARCHITECTURE.md and Claude/memory/MEMORY.md (+ the memory files it indexes)
3. tas-hub/audits/* and the latest Claude/SYSTEM-AUDIT-*.md
4. tas-hub/docs/superpowers/specs/2026-06-02-field-dispatcher-design.md and memory reference_field_dispatcher_parked + reference_hermes_agent_eval (prior decisions to re-open)
5. The skills (Claude/.claude/skills/ + the tas-operator suite), the scheduled agents, and the hooks
</read_first>

<primary_lens>
The single most important evaluation is the ARCHITECTURE ITSELF — not feature-shopping. Efficiency, output quality, future-proofing, and the human-expert goal all rest on a clean foundation: how the whole system is organized, and above all how MEMORY and CONTEXT are structured (what loads always vs. on-demand, how the brain is partitioned, how the right context reaches the right skill without bloat or loss). Critique and redesign that foundation FIRST. New Anthropic features and models matter only insofar as they strengthen this foundation or the three goals below — evaluate them SECOND, in service of the architecture, never as ends in themselves.
External third-party tools (agent frameworks like Hermes, third-party note/memory apps like Obsidian) are a SETTLED "no" — Anthropic-native is the path and only gets stronger as the platform advances; do not spend effort re-shopping them.
</primary_lens>

<mandate>
Maximize three goals at once: (1) HUMAN-FEEL — Tish drops messy multi-project updates/requests in natural language and the system distributes work correctly, holds full context, and never drops a step; (2) EFFICIENCY — minimal standing complexity, low token/maintenance overhead, no parts that don't earn their keep; (3) OUTPUT QUALITY — reports, client comms, and deliverables at senior-consultant standard, determinism preserved where correctness is non-negotiable.
Working from the FOUNDATION OUTWARD, evaluate every layer — memory & context design FIRST, then identity, skills, scheduled agents, hooks, data architecture (esp. the split project-status source of truth), the dispatch/channel layer, security, and the output-quality pipeline (report writer, verification hooks, reviewer). For each: keep / cut / redesign given your capability.
</mandate>

<reopen_these_decisions>
Re-judge each explicitly and state HOLD or REVERSE with reasoning:
- The architecture and the memory/context structure itself — is it the leanest, most future-proof shape for an AI partner running the WHOLE business (consulting, expansion, reporting, admin), or did it accrete around a weaker model's limits?
- The "field dispatcher" being PARKED rather than built — has its trigger effectively arrived, or can YOU build it reliably now?
- The "no-regret core" (single source of truth for project status, portal → GET /api/hub) — still the highest-leverage foundation?
- Anything in the current setup that was a workaround for a weaker model and is now unnecessary dead weight.
</reopen_these_decisions>

<output_format>
1. One-paragraph verdict — the single highest-leverage change + overall system health.
2. Current-state map — what exists, graded on human-feel / efficiency / output-quality.
3. Reopened decisions — each with HOLD/REVERSE and why.
4. Prioritized roadmap — P0/P1/P2, each with: change, revenue-linked why, effort, risk if applied, cost if skipped.
5. What NOT to do — tempting changes you reject, with reasoning.
6. Open questions for Tish before he approves.
Separate HIGH-confidence from SPECULATIVE. Do not invent capabilities you haven't verified. Stop after the plan; change nothing.
</output_format>

[Stamp before running: model = __________ · date = __________ · what changed since 2026-06 (new platform features, projects, pain points) = __________]
```

## 6 — Single source of truth for project status (the no-regret foundation)
The one no-regret build that helps Dispatch today AND is the foundation the field dispatcher needs.
```
You're in Claude Code on Tish Titina's Windows host (he/him), owner of Titrin AgriSoil Solutions.
GOAL: end the split where project status lives in two places — tas-hub/src/constants.ts (INITIAL_DATA)
and TITRIN Claude/memory/projects/active-projects.md — with the portal reading the stale compiled
constants. Make active-projects.md (auto-updated weekdays by end-of-day-update) the single source of
truth the portal reads via GET /api/hub.
START by scoping with the brainstorming skill (don't jump to code): map the current data flow
(constants.ts → useAppData.ts → UI; the Netlify Functions backend at netlify/functions/ + Netlify
Blobs), define the contract (active-projects.md → structured JSON the portal consumes), and account for
the field-PIN data-stripping already in useAppData.ts. Then implement behind the existing GET /api/hub,
keeping INITIAL_DATA as a fallback so nothing breaks when the backend is down. Preserve dual-PIN gating
and the noteJournal two-way comms. Propose the plan for approval before building; don't break the live
portal, invoicing, or report paths.
Context: this is the foundation the parked field dispatcher needs —
tas-hub/docs/superpowers/specs/2026-06-02-field-dispatcher-design.md.
```

---

## Bigger, when you're ready
- **Soil-tracking portal** — you've floated a separate soil-tracking app beyond tas-hub. When ready, start with the brainstorming skill to scope it (use case, data model, who uses it) before any build.
- **Monthly self-audit** — already a routine (`audits/monthly-self-audit.md`); it'll re-surface anything left in `CANDIDATE-EDITS.md`.
