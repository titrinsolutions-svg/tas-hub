# Full TAS architecture review — prompt for a future Claude model

> Paste the block below into a capable Claude (Cowork or Claude Code). It's a read-only
> architecture audit; it presents a prioritized plan and waits for Tish's approval before changing anything.
> Saved 2026-05-28.

---

You are performing a comprehensive **architecture review** of the entire TAS (Titrin AgriSoil Solutions) Claude system for **Tish Titina, P.Ag. (he/him)** — a solo agrology / regulatory consultant in Richmond BC who runs his business **primarily through Claude Cowork**. Revenue from this consulting funds the system; judge everything through a **revenue + Cowork-first lens**.

## What to assess
Whether the architecture is:
1. **Self-improving** — do the learning loops actually close? (CANDIDATE-EDITS.md queue → review → apply → measure; email-lessons.md / report-lessons.md capture; monthly audit; in-session capture). Is anything captured-but-never-applied, or applied-but-never-captured?
2. **Future-proof** — will it break as new report types / tools / scheduled agents are added? Are there latent footguns (hardcoded lists, silent truncation, host/sandbox assumptions)?
3. **Easy to build on** — are the extension points clean and documented? Test it concretely: how many steps to (a) add a new report type, (b) add a skill, (c) add a scheduled agent, (d) add a tool? Each should be obvious + low-friction.
4. **Bottleneck-free + efficient** — token-efficient session loads (lean always-on CLAUDE.md + on-demand files); no manual glue between pipeline stages; clean host/sandbox division.
5. **Best output for the business** — reports, invoices, fee proposals, emails, client + ALC/municipal work. Is the quality bar enforced (verifiers, reviewer, branding) and is anything able to ship flawed?
6. **Portable** — could the whole system move to another PC cleanly? (Check `Claude/SETUP-NEW-MACHINE.md`, hardcoded paths, the `~/.tas/` creds, the Documents↔repo mirror, Windows-task assumptions.)

## The system (read these)
- **Brain:** `C:/Users/Tish/Desktop/TITRIN/CLAUDE.md`, `Claude/CLAUDE.md`, `Claude/ARCHITECTURE.md`, `Claude/memory/` (context, feedback, municipalities, people, playbooks, projects, workflows, report-knowledge-base, `data-sources.md`, `*-lessons.md`, `glossary.md`).
- **Tools (~26):** `Claude/TAS - Tools/` (generators, harvesters, auth, health checks, `property_research.py`, `report_specs/`). Plus `requirements.txt` + `CONVENTIONS.md`.
- **Skills:** custom in `Claude/.claude/skills/` (email-responder, project-lead, tas-report-writer, tas-report-reviewer, tas-fee-proposal); plugin skills (tas-operator hats, tas-kickoff, tas-invoice-generator).
- **Scheduled agents:** `Documents/Claude/Scheduled/` is the **LIVE** copy the scheduler reads; the host `TAS-Git-Backup` task mirrors it into the TITRIN repo (which also keeps `archive/`). 9 active.
- **Host vs sandbox (critical):** Cowork runs in a **Linux sandbox** mounting only TITRIN — it can't reach `~/.tas/` (OAuth creds) and git is unreliable there. Host (Claude Code + Windows tasks) has both. `Claude/memory/reference_tas_scripts_host_only.md` maps which tool runs where. In Cowork, Gmail/Calendar = the **connector MCPs** (no weekly OAuth expiry); the host Python Gmail/Calendar tools use `~/.tas/` (weekly expiry).
- **START HERE:** `Claude/CANDIDATE-EDITS.md` — the running queue of known improvements + decisions, with the latest audit's done/open items. Read it first so you don't re-find known issues.

## Method
- If you support multi-agent orchestration, **fan out one reviewer per layer** (brain/memory integrity; tools health; skills triggering + overlap; scheduled-agent reliability; deliverable output quality; portability; the host/sandbox boundary; the self-improvement loops), then synthesize. **Adversarially verify** each finding before reporting — don't report plausible-but-wrong.
- Be **concrete**: cite `file:line`. Prioritize by revenue + Cowork-first impact.
- Apply Tish's **"no marginal refactors"** rule: don't propose changes saving < ~$50/yr on a working system. Surface real wins (breakage risk, bottlenecks, quality gaps, extension friction, portability gaps) and genuine quick wins.
- **Tish is he/him** — a past session misgendered him from a stale memory; `user_role.md` is now correct, keep it that way.
- Treat the **weekly Google OAuth** re-auth as a known/accepted constraint (restricted scopes + unverified app; the Workspace Internal-app migration is the only permanent fix and is deferred) — don't relitigate it.

## Output
A prioritized, decision-ready plan grouped into **Fix-now / Output-quality / Future-proofing / Portability / Quick-wins / Decisions-for-Tish**. For each item: why it matters (business impact), concrete action + target file(s), effort (S/M/L), confidence. End with an honest **overall architecture-health assessment** and the **top 3 things to do next**. Then append the genuinely-new findings to `CANDIDATE-EDITS.md`.

**Do the review READ-ONLY first; present the plan; let Tish approve what to action before changing anything.**
