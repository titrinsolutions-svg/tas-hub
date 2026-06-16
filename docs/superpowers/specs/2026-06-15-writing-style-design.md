# TAS Writing Standard — design + implementation record

**Date:** 2026-06-15 · **Status:** implemented (awaiting Tish review) · **Owner:** Tish (decisions) / Claude (build)

## Goal
Make every AI-produced TAS email and report **concise, professional, well-articulated** — and make it *stick* going forward, across both Cowork and Claude Code, instead of living as a soft line that gets under-weighted.

## Why this was needed (the real problem)
A "Sharp, concise, professional register" directive already existed in `email-lessons.md` (2026-06-06) and `report-lessons.md` already had a READER-FIRST section — yet output stayed lengthy. Diagnosis (Tish's own [model-independence] principle): **a soft lesson-line doesn't enforce itself.** The fix is a gate + an always-on rule, not a third restatement.

## Decisions locked (with Tish, 2026-06-15)
1. **One unified TAS voice**, with per-channel adaptation (reports / emails / proposals).
2. **Register = verdict-first + precise**, leaning into the **scientific / professional-consultant** way of speaking (evidence → interpretation → recommendation; quantify where defensible; measured authority).
3. **Enforcement = lean reuse of existing gates** — "don't over-engineer, keep it clean." No new infrastructure.

## The standard
Canonical doc: `TITRIN/Claude/memory/writing-standard.md` (single source of truth). Seven rules: verdict-first; evidence-before-conclusion; one idea per paragraph; every sentence earns its place; precise not padded; state it directly; restraint markers. Plus a banned-filler list.

## The Guardrail (non-negotiable)
"Concise" touches **FORM only** (filler, hedging, redundancy, throat-clearing, length). It **never** thins certified **substance**: References, Limitations, liability / drainage clauses, P-10, CSR / ALR Use Reg s.36, COI, citations, the conservative drainage register. Substance wins. The mechanical scan is WARN-only and can never become a hard fail or touch a clause.

## Files changed
| File | Change |
|---|---|
| `Claude/memory/writing-standard.md` | **NEW** — the canonical unified voice |
| `Claude/TAS - Tools/verify_report.py` | `FILLER_PHRASES` regex + a WARN-only "Concision (filler phrases)" soft check in `evaluate()`; docstring note |
| `Claude/TAS - Tools/test_verify_report.py` | `ConcisionFillerSoftCheck` (3 tests): warns on filler, passes clean prose, ignores single-word hedges |
| `Claude/.claude/skills/tas-report-reviewer/SKILL.md` | ADVISORY check #15 (verdict-first structure + listed filler, bounded/objective) + carve-out in the two "do not flag style" lists |
| `Claude/memory/email-lessons.md` | Sharpened the 2026-06-06 concise line → points to the standard; keeps the warmth calibration |
| `Claude/memory/report-style/house-style.md` | Pointer to the standard |
| `CLAUDE.md` (TITRIN root) | Always-on "House writing voice" rule + Lookup Index row |

Deliberately **not** changed: `report-lessons.md` (26,965 B — 35 B under the 27 KB doctor warn line; its READER-FIRST already covers reports; growing it would trip a new WARN). Flagged for a distill/trim.

## Enforcement (how it sticks)
- **Always on:** the `CLAUDE.md` rule line loads every session in both runtimes.
- **Reports:** reviewer #15 (judgment, bounded) + `verify_report.py` filler scan (mechanical, WARN). Final/milestone reports already hard-fail without a reviewer receipt, so the judgment check rides the existing gate.
- **Emails:** standard + Tish's pre-send review (sends are manual/gated). No email gate by design — would be over-engineering.

## Verification
- `verify_report` unit tests: **40 pass** (was 37) — green before and after.
- Full TAS test suite + `system_health.py` doctor: see the session scan.

## Reversibility
Every change is a small, self-contained edit (one new file + targeted additions). Revert = delete `writing-standard.md`, drop the `FILLER_PHRASES` block + the one soft-check append + its test, remove check #15 + the two carve-out clauses, and revert the three pointer edits.

## Follow-ups
- Distill/trim `report-lessons.md` (at the warn line); add its pointer to the standard then.
- If a *built* copy of the `tas-operator-hats` plugin ships the reviewer skill separately from this source, rebuild it so #15 propagates to the namespaced version.
