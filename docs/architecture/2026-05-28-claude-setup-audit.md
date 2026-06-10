# Claude / Cowork / Code Setup Audit — 2026-05-28

> Read-only audit (5 parallel agents) of Tish's whole setup: TITRIN layout, the non-TITRIN
> footprint, automation/health, and Claude/Cowork config. Generated during the host-bridge build.
> Feeds roadmap **Task #10** (TITRIN tidy + setup optimization — a deliberate, human-in-loop pass).
> Nothing here was changed; this is findings only.

---

## FOUNDATION VERDICT

**The setup is architecturally sound and safe to keep building on.** Separation of concerns is professional-grade: the TITRIN brain (git-backed, portable), Claude runtime config under `~/.claude`, and credential isolation at `~/.tas` (never synced). Working git backup, scheduled automation, memory stratification, and SessionStart health checks. **It will not break tomorrow.**

Three categories of friction cost maintenance overhead and hide coupling risk:
1. **Template & asset sprawl** — 6 signature variants, 6 logos, 6 report templates, 6 client-agreement versions → scripts can silently pick the wrong file.
2. **Stale artifacts** — 66 MB inbox staging, 9.5 MB legacy audit snapshot, 688 KB `__pycache__`, `.tmp` files, a stale `Project Tracker.xlsx`.
3. **Hardcoded path coupling** — CLAUDE.md references script paths verbatim; no path-alias layer; `active-projects.md` is ~31 KB (at the Cowork truncation ceiling).

**Top 3 high-leverage actions:** consolidate to one canonical template/signature each (update CLAUDE.md to point at it); automate inbox-staging filing; add a `paths.json`/PATHS alias layer so folder renames don't silently break tools.

---

## WHAT LIVES WHERE (the clean mental model)

**TITRIN (`C:\Users\Tish\Desktop\TITRIN`)** — the canonical, git-backed business brain:
- `CLAUDE.md` (constitution, read by both runtimes), `Claude/ARCHITECTURE.md`
- `Claude/memory/` (playbooks, feedback, `projects/active-projects.md` — the live source of truth)
- `Claude/Scheduled/` (portable mirror of live Cowork task SKILL.md, synced nightly)
- `Claude/TAS - Tools/` (all Python tools)
- `TAS - Projects/Active|Archive/`, `TAS - Invoices/`, `TAS - Client Agreements/`, `TAS - Reference Library/`, `TAS - Branding & Templates/`
- `_inbox-staging/` (transient harvest), `TAS-Brain/` (Obsidian vault — not live state), `titrin-web/` (portal source)
- `.claude/settings.json` (project-local hooks: system_health.py, preflight_docx.py)

**Host home (`C:\Users\Tish`)** — Claude Code runtime + credentials:
- `.claude/settings.json` (plugins, hooks), `.claude/plugins/`, `.claude/projects/` (auto-memory), `.claude/.credentials.json` (MCP OAuth — ⚠ 2 client secrets stored here)
- `.tas/` — **credential vault, NEVER synced** (gmail/, calendar/ tokens)
- Windows Task Scheduler: `TAS-Git-Backup` (daily), `TAS-Inbox-Harvest` (weekdays 5:20 PM), `TAS-Report-Harvest` (Wed 4:45 PM)

**Cowork desktop (`AppData\Roaming\Claude`)**:
- `claude_desktop_config.json` — **folder permissions live here** (TITRIN trusted, tas-hub bypassPermissions). *This is the lever to grant Cowork more folders.*
- `Documents\Claude\Scheduled/` — 9 live Cowork task SKILL.md files

---

## ISSUES BY SEVERITY

### 🔴 HIGH
- **MCP client secrets in plaintext** — `~/.claude/.credentials.json` holds Figma + Egnyte client secrets. Migrate to env vars. [human-in-loop]
- **Gmail OAuth weekly expiry** — unverified-app token (~7-day). It tested **valid today** (auth-check OK, token refreshed 5:20 PM), but the cadence means re-auth (`TAS-Reauth.py`) is a standing weekly chore; the health check already warns. [human-in-loop]
- **Path coupling** — hardcoded script paths + no shared-lib version pinning → folder renames silently break tools. Add a PATHS alias layer. [human-in-loop]
- **`active-projects.md` truncation risk** — ~31 KB at the Cowork ceiling; Edit/Write can silently truncate. Keep < 25 KB; archive aged entries. [safe-auto]

### 🟡 MEDIUM
- Report/invoice template sprawl (6); client-agreement version confusion; signature (6) + logo (6) sprawl; `_inbox-staging` 66 MB with no auto-filing; 40 MCP OAuth entries (0 active tokens); SessionStart hook tightly coupled to reading CLAUDE.md; 5 disabled plugins installed.

### 🟠 LOW
- Stale `.tmp` files (`cowork-deltest-2.tmp`, 3 in `TAS - Invoices/`); `__pycache__` 688 KB; legacy `_archive/_audit-2026-05-20` (9.5 MB); stale `Project Tracker.xlsx`; Madrone harvest artifacts in a live folder; blocklist test entries; missing `settings.local.json`; doc time mismatch (`TAS-Report-Harvest` is 4:45 PM not 5:00 PM); stale `~/.tas/backups/*.bak`.

---

## PRIORITIZED ACTIONS (for Task #10 — the deliberate tidy)

**Safe-auto (Claude can just do, on your nod):** delete stale `.tmp` files + `cowork-deltest-2.tmp`; clear `__pycache__`; remove blocklist test entries; create empty `settings.local.json`; fix the `automation_and_scheduled_tasks.md` time typo; delete the stale token `.bak`.

**Human-in-loop (need your decisions):** consolidate templates/signatures/logos/agreements to one canonical each + a `Branding-README.md`; migrate Figma/Egnyte secrets to env vars; prune unused MCP OAuth entries; automate `_inbox-staging` filing + retention; add the PATHS alias layer; deprecate `Project Tracker.xlsx`; dedupe Madrone reference reports.

**Discuss:** refactor/keep the SessionStart hook; uninstall vs keep the 5 disabled plugins; `autoUpdatesChannel` latest→stable; a monthly host-side `TAS-Health-Check.py` alert.

---

## UPSTREAM COUPLING — what future builds must respect
1. Don't rename folders without updating CLAUDE.md (no alias layer yet).
2. Keep `active-projects.md` < 25 KB (truncation ceiling).
3. Shared libs (`tas_*_lib.py`, `tas_gmail_auth.py`) have no version pinning — a breaking change hits all consumers (the new bridge included).
4. Scheduled-task specs mirror nightly via git — if that sync breaks, the portable mirror goes stale.
5. Templates/signatures are imported by hardcoded path — moving one silently breaks report/invoice generation.
6. OAuth expiry cascades to every Python Gmail tool (now including the bridge).

> **Bridge note:** the new `TAS-Host-Bridge` adds one more consumer of `~/.tas` creds + the shared Gmail tools, and one more Windows scheduled task — so items 3, 5, and 6 above now apply to it too. The bridge's own health check (system_health.py) covers item 6's surfacing.
