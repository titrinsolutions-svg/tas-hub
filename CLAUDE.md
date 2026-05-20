# TAS Hub — Repo-Local Instructions

This file is loaded automatically by Claude Code at session start. Treat it as the **project surface** for tas-hub; the **full business brain** lives in the TITRIN folder and is imported below.

## Identity & context
Tish Titina, P.Ag. — Principal Agrologist / owner of Titrin AgriSoil Solutions Ltd. (TAS). Revenue from this work pays the bills; treat client-facing and revenue-generating work as the priority over engineering polish.

For full identity, services, current active files, pricing, branding, scripts, memory layout, scheduled tasks, and report-writing rules, see the canonical TAS brain:

@C:\Users\Tish\Desktop\TITRIN\CLAUDE.md

## tas-hub repo specifics

**Stack:** Vite 6 + React 19 + TypeScript + Tailwind 4 + Motion + Lucide. Optional Express backend on port 3000 proxies Firebase / Gmail / Ollama / Gemini calls.

**Deploy (V2 — canonical):** Netlify — `tas-hub-titrin.netlify.app`. GitHub Actions auto-deploys on push to `main` (`titrinsolutions-svg/tas-hub`). **Backend is Netlify Functions in this same repo** at `netlify/functions/`, persisting via Netlify Blobs — see [project_backend.md memory](C:\Users\Tish\.claude\projects\C--Users-Tish-Downloads-tas-hub\memory\project_backend.md). The previously documented Render URL (`tas-hub-backend.onrender.com`) was never deployed and is obsolete. V1 on Cloudflare Pages is archived — do not propose deploy changes against it.

**Auth:** Dual-PIN. Admin (`VITE_ADMIN_PIN`, default `8474`) sees everything. Field (`VITE_FIELD_PIN`, default `8888`) gets dashboard + projects + field form only — money/AI/email stripped at the data layer in [`useAppData.ts`](src/hooks/useAppData.ts), not just hidden in UI.

**AI fallback chain:** backend up → Ollama via `/api/ollama/chat` (8 models, default Gemma 4); backend down → direct Gemini 2.0 Flash via `VITE_GEMINI_API_KEY`. Context auto-injected via `buildContext()`.

**Data:**
- App data hardcoded in [`src/constants.ts`](src/constants.ts) — `INITIAL_DATA` (~25 projects, invoices, actions, money tracker).
- UserEdits in localStorage key `tas_hub_ue`, debounced 2s sync to Firebase via `/api/hub` when backend reachable.
- Two-way comms: `noteJournal` in UserEdits — `{id, author: tish|ai|field, ts, text, resolved}`. Tish ↔ Claude ↔ field tech.
- Known friction: projects are maintained in TWO places (`constants.ts` here, `Claude/memory/projects/active-projects.md` in TITRIN). End-of-day-update agent writes the latter; portal still reads compiled constants. Wiring portal → `GET /api/hub` is on the backlog.

**Project shape:** badges `fp` (Farm Plan), `alc` (ALC App), `fqa` (Fill Quality Assessment), `cemp` (CEMP), `sfu` (SFU), `new`.

**Repo housekeeping:**
- `.claude/` is gitignored. Stale worktrees may accumulate there — safe to delete.
- Lint: `npm run lint` (tsc --noEmit only — no ESLint).
- Build: `npm run build`. Dev: `npm run dev` (port 3000).

## What I'm allowed to do without asking
- Add CLAUDE.md / memory / docs / non-runtime improvements
- Refactor for clarity (small, reviewable) when revenue-aligned
- Draft content (SEO copy, blog posts, emails) — always saved as drafts, never sent
- Update memory files when I notice they're stale

## What I MUST ask before doing
- `git push`, `git reset --hard`, force-push, branch deletion
- Pulling/merging on `Desktop/TITRIN/` (local has unstaged reorg vs 23 remote commits — see [TITRIN repo state memory](C:\Users\Tish\.claude\projects\C--Users-Tish-Downloads-tas-hub\memory\project_titrin_repo_state.md))
- Touching client data folders (`TAS - Projects/`, `TAS - Invoices/`, etc. — all gitignored, all sensitive)
- Adding new scheduled tasks (Cowork-managed)
- Anything that would publish, deploy, or send

## Revenue lens (the priority filter)
Before suggesting work, ask: does this help acquire, retain, or serve a client? If no, deprioritize. The bottleneck for TAS is not code quality — it's lead flow, conversion, and delivery throughput.
