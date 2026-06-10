# Report-Knowledge Consolidation — Design & Migration Spec

**Date:** 2026-06-01 · **Approved by Tish** 2026-06-01 · **Status:** ready to execute in a FRESH Claude Code (host) session.
**Why deferred:** the analyzing session was near the 1M context limit; a half-done migration of the revenue-critical, liability-bearing report brain would be worse than not starting. Execute with ample context.

## Goal (Tish's vision)
A per-report-type **standards + benchmark library**: each type has ONE readable file Cowork reads *in full* (no truncation) carrying structure + templates + technique + the quality bar; the bar **ratchets up** as high-quality external reports are harvested; it **extends to new report types**. Reports are the product and the reputation — this raises and protects quality while improving token efficiency. ("As good as → exceed the best report of each type; best-in-class.")

## ⚠️ CRITICAL LANDMINE — read before doing anything
A per-type split of `report-knowledge-base.md` was **already tried on 2026-05-20 and REVERTED** because the per-type files became verbatim duplicates of the monolith. Dead evidence: `Claude/memory/report-knowledge-base/` holds **13 × ~0.6 KB "do-not-read" redirect stubs**. **DO NOT re-split the monolith into a parallel per-type folder.** The fix is to **CONSOLIDATE per-type content INTO the existing `playbooks/<type>.md`** (the one per-type home) and split only genuinely *cross-type* reference into small topic files. **Verify playbook coverage BEFORE retiring any monolith content.**

## Current state (mapped 2026-06-01) — per-type content scattered across 4 layers
1. `Claude/memory/playbooks/<type>.md` — 9 files, 7–12 KB (lca, farm-plan, fqa, rma, closure-memo, cemp, esa-dp, reclamation, phase1-esa, fill-feasibility, + _README). **Per-type OPERATIONAL home. Readable. KEEP as the home.**
2. `Claude/memory/report-benchmark.md` — 19.4 KB. Per-type champions + excellence markers + ratchet Update Protocol. **Tish's vision, already built. KEEP** (the per-type "bar"). Borderline size; fine.
3. `Claude/memory/report-knowledge-base.md` — **49.6 KB MONOLITH**, native-edit-only (truncates). §1 per-type catalog (1.1–1.13) **overlaps playbooks**; §2 section templates; §3 data-integration patterns; §4 QA checklist; §5 common technical content (soil terms, CLI subclasses, ALC regs, bylaw + standard citations); §6 improvement notes; §7 cross-references; §8 inventory (already moved out). OVERSIZE → Cowork read-truncates.
4. `Claude/memory/TAS-report-style-guide.md` — **46.3 KB MONOLITH**, native-edit-only. §1 firm identity; §2 Madrone style ref; §3 McTavish style ref; §4 TAS house style; §5 per-type templates (5.1–5.9) **overlaps playbooks**; §6 regulatory/technical ref; §7 common tables; §8 boilerplate phrases; §9 references/citations; §10 quick-ref report-selection guide. OVERSIZE → read-truncates.
Leave alone: `report-knowledge-base-inventory.md` (14.3 KB; harvester appends here — good), `madrone-conventions.md`, `report-lessons.md`, `figure-building-approach.md`, `report-templates-index.md`.

## Target architecture
- **Per-type home = `playbooks/<type>.md`.** For each type, fold in (verbatim, only what's missing) the matching monolith **§1.x** catalog entry + style-guide **§5.x** template → playbook = structure + templates + technique + a pointer to its `report-benchmark.md` row. Keep each playbook coherent and < ~20 KB.
- **`report-benchmark.md`** unchanged — the per-type bar / ratchet.
- **Cross-type reference → small focused topic files** (each < ~20 KB, read in full). Suggested grouping (adjust to keep coherent, don't over-fragment):
  - `report-reference/technical-terms.md` ← monolith §5 (soil classification, CLI subclasses, ALC reg refs, bylaw + standard citations).
  - `report-reference/qa-checklist.md` ← monolith §4 + §6 + §7.
  - `report-reference/section-templates.md` ← monolith §2 + §3 (or fold per-type bits into playbooks).
  - `report-style/house-style.md` ← style-guide §1, §4, §10.
  - `report-style/external-style-refs.md` ← style-guide §2 (Madrone) + §3 (McTavish) — or fold into the existing `madrone-conventions.md`.
  - `report-style/regulatory-reference.md` ← style-guide §6.
  - `report-style/tables-and-boilerplate.md` ← style-guide §7, §8, §9.
- **Retire (archive to `Claude/_archive/`, reversible):** the 2 monoliths (after migration) + the 13 dead `report-knowledge-base/` stubs.

## Migration steps (careful, verified, nothing lost)
0. **Snapshot** report-knowledge-base.md + TAS-report-style-guide.md → `Claude/_history/` (and rely on git too).
1. **Verify coverage:** per type, diff monolith §1.x + style-guide §5.x against `playbooks/<type>.md`; list what's missing from the playbook.
2. **Fold in (native edit):** append the missing per-type content verbatim into each playbook. Coherent, < ~20 KB each.
3. **Build cross-type topic files:** move monolith §2–7 + style-guide §1–4,6–10 into the focused files above, verbatim, grouped.
4. **Verify nothing lost:** checklist — every section of both monoliths now lives in a playbook or a topic file.
5. **Retire monoliths:** replace each with a short pointer stub (or archive) → "split into `playbooks/` + `report-reference/` + `report-style/`; see CLAUDE.md lookup index."
6. **Retire the 13 dead `report-knowledge-base/` stubs** (archive).
7. **Update ALL references** to the new homes. Grep `report-knowledge-base|TAS-report-style-guide` across `Claude/` (≈37 files matched 2026-06-01); update the LIVE ones, ignore `SYSTEM-AUDIT-*.md` historical snapshots. Key live ones: `CLAUDE.md` (lookup index + report-KB line), `Scheduled/report-harvester-enhanced/SKILL.md` (keep its inventory-append; repoint the "durable reference §1–7" mention), `Scheduled/tas-monthly-housekeeping/SKILL.md`, `.claude/skills/tas-report-writer/SKILL.md`, `report-templates-index.md`, `madrone-conventions.md`, playbook cross-refs.
8. **Verify:** every new file < read ceiling; grep shows no live reference to a retired path; sanity-check "where does Cowork look for report type X"; run `system_health.py`.
9. **Snapshot + `GIT-BACKUP.py`**; log the outcome in `CANDIDATE-EDITS.md`.
10. **Update `ARCHITECTURE.md`** (Layer 2 memory map) + `report-benchmark.md` "Related" pointers to the new structure.

## Hard constraints
- **NATIVE edits only** on the big files (Edit/Write silently truncate them).
- **Verbatim moves — do not rewrite** (technical/regulatory content is liability-bearing; preserve precision).
- **Verify playbook coverage BEFORE dropping monolith content.**
- Revenue-critical + P.Ag.-liability-bearing → **careful > fast; nothing lost; nothing broken upstream/downstream.**
- Use a session with ample context (big multi-file migration).

## Paste-ready execution prompt (for a fresh Claude Code session)
```
You're in Claude Code on Tish Titina's Windows host (he/him), owner of Titrin AgriSoil Solutions. Execute the APPROVED report-knowledge consolidation: read the full spec at C:\Users\Tish\Downloads\tas-hub\docs\superpowers\specs\2026-06-01-report-knowledge-consolidation-design.md and carry it out exactly. It has the goal, current-state map, a CRITICAL landmine (a naive per-type split was reverted 2026-05-20 — do NOT recreate it), the target architecture, step-by-step migration (snapshot + verify-coverage-before-dropping + verbatim NATIVE edits), every reference to update, and verification gates. Reports are the revenue-critical, liability-bearing product — careful > fast, nothing lost, nothing broken upstream/downstream. Snapshot + verify coverage before retiring anything; GIT-BACKUP + log in CANDIDATE-EDITS.md at the end.
```

## Parked (separate, do as its own clean step)
`TAS-Memory-Export.py` — host tool to export the live auto-memory store → `Claude/memory/feedback/` (the monthly housekeeping defers this; needs the export convention nailed first). See `CANDIDATE-EDITS.md`.
