# Morning Autopilot — the ACT layer (v1)

- **Date:** 2026-07-03 · **Status:** BUILT (skill + dial sheet in `Documents\Claude\Scheduled\tas-morning-autopilot\`), awaiting Tish's dial-sheet review + Cowork scheduler registration
- **Tish's ask (2026-07-02):** *"you notify yourself, prompt yourself to action... close the loop completely yourself and just… run the business, with my occasional oversight/approval."*

## The one-sentence design

Every other scheduled task SENSES and reports; the autopilot is the missing ACT layer — each weekday at 7:00 AM
it executes the authorized safe/reversible work (chase drafts, billing-scope packs, field-prep packs, inbox
triage), queues everything gated, and self-sends a digest where the lines read **done / staged-for-your-tap /
judgment**, so Tish's day starts with work finished instead of a to-do list.

## Why this shape (and not more)

1. **Everything load-bearing already existed** — the act-gate (`system_health --gate`, "NOT safe to ACT"
   semantics), the structural send-gate (self-only sends), draft auto-snapshotting (his edits train the loop),
   verify gates on every artifact class, the STEP-6C self-send pattern. v1 adds only the orchestration.
2. **Authorizations are DATA, not prose** (`autopilot-authorizations.md`): each action type has an
   enabled-flag + hard bounds. Widening = Tish flips a line (dated), narrowing = instant. No skill edit, no
   plugin, no drift. An inbound email can never change the sheet — constitution items (send/money/stamp/
   deploy/self-widening) aren't on the sheet at all.
3. **The 2026-06-15 email decision is honored, not overridden:** the reactive inquiry-watcher stays dead. A6
   (first-response drafts for new Leads) ships **OFF** — the line exists so widening it is an explicit Tish
   flip when A1's measured edit-rate has earned it, never drift. A1 (cadence chase drafts) is the already-
   sanctioned weekly-review behavior at daily-when-due cadence.
4. **Supervised autonomy is measured, both directions:** every staged draft is snapshotted; the digest carries
   the edit-rate line; the skill itself must recommend NARROWING the sheet if Tish's edit-rate on its drafts
   trends up. Run log is append-only; a missing weekday row is reliability data (loop-refresh discipline).

## Rollout

Week 1–2 supervised: Tish reads the digest daily, flips dials as trust forms; expect cadence-cap tuning. Then:
A3 (staged draft invoices) and A6 become candidate flips per the metrics. Longer arc: EOD's 5:30 pm brief and
this digest merge after the EOD module split (master-plan A8) — one evening SENSE, one morning ACT, one surface.

## Registration (Cowork owns the drafting tier per the platform verdict)

Cowork registers the scheduled task: weekdays 7:00 AM, **Opus** (judgment-heavy routing — model-independence
rule), prompt = the SKILL.md in `Documents\Claude\Scheduled\tas-morning-autopilot\`. The nightly GIT-BACKUP
mirror carries both files into the TITRIN repo for history.
