# TAS 10X Master Plan — 2026-07-02

> Produced by a 26-agent orchestrated review (2 workflow runs: 6 Sonnet mappers, 5 Opus judges, 12 Opus
> adversarial verifiers, +1 lost to a structured-output fluke; ~2.13M subagent tokens). Every report-quality
> finding below was adversarially verified against the live gate code before it earned a line. Synthesis: Fable 5
> with the full locked-decision context. **Read `Claude/memory/VISION.md` before executing any wave** (P9 is why
> this scan exists; P10 governs how to pick within it).

## The honest baseline

This system is NOT under-built. 899 tests green; a real deterministic gate layer (verify_report + verify_substance,
4 HARD + ~17-22 advisory checks); a reviewer skill with a calibrated rubric and receipt hard-fail; CAPTURE live;
MEASURE reconnected 2026-07-02; DECIDE/QUEUE plumbing fully built; 16 scheduled tasks + 13 operator hats covering
the pipeline end-to-end with the send/money/stamp/deploy gates correctly human-forever. Three audits since June
already closed most structural debt. The 10X is NOT "build more automation everywhere" — it is three specific
leverage axes:

1. **Output quality at senior-P.Ag grade** — the gates enforce STRUCTURE and CLAUSES; the highest-frequency
   professional errors (numbers, drainage-vs-evidence, spec completeness) still ride on model judgment. The June
   2026 external callout class is still open on 8 of 10 report types.
2. **Close the RSI loop** — PROPAGATE is the missing organ ("where recursive lives"); metrics/fitness reading is
   the substrate it needs. Everything else in the loop now exists.
3. **Cash latency** — the funnel doesn't leak at capture or tooling; it leaks at **weekly-only forcing functions**
   on billable-now work (Sun 26.0017: 5+ months unbilled; Cheema 26.0018: never invoiced).

## Wave 0 — applied this session (2026-07-02) ✅

- `tas_signal.py parse_receipt_highs`: structural `### H<n>` recount cross-checked vs the header integer, larger
  wins — a reviewer that miscounts its own header can no longer silently under-report defects into MEASURE.
  +1 test; suite 898→899 green. [CONFIRMED finding, closed]
- `tas-report-reviewer/SKILL.md`: duplicate check "16." renumbered → 17 (+2 cross-refs fixed).
- `morning-brief/SKILL.md`: Money-watch now reads `unbilled-work-tracker.md` and surfaces a **BILL-READY** line
  (max 3, oldest first) — a bill-ready file no longer waits for the Monday sweep to be visible.
- MIRROR NOTE banner added to the 10 recurring scheduled SKILL.md files that lacked it (canonical Documents
  copies; the silent-edit-loss footgun on an auto-submitting bid pipeline is closed).
- Repo hygiene: mojibake `C:tmp` scratch file + dead `.wrangler/` V1 artifact deleted from tas-hub.
- False positives killed before they cost anything: `make_client_draft.py` UTF-8 "gap" (bytes-mode capture — safe);
  figure-furniture caption gate (furniture is pixels — a text gate would fire on every correct figure).

## Wave R — report quality as a senior agrologist (the new territory)

Verified verdicts from the three-lens Opus panel (P.Ag peer reviewer / ALC-municipal regulator / consulting
partner), each adversarially checked against the live code. House rules apply to every build: WARN-only first
release, quiet-unless-right, skip-on-unparseable, teach-in-the-message.

| # | Build | Verdict | Effort |
|---|-------|---------|--------|
| R1 | **Spec-completeness gate**: load the detected type's `report_specs` JSON; WARN per missing `sections` (num+title match), `mandatory_references` (distinctive tokens only: "375/96", author+year — never full-string), `tables` (keyword). The mandated writer path is freehand python-docx, so today the 10 specs gate nothing. | CONFIRMED | M |
| R2 | **CSR/lab numeric recompute** (the June-callout error class): parse the "Results vs CSR Schedule 3.1 Column III" table per fqa.json shape; WARN when a value exceeds its stated limit but the verdict cell reads pass, units mismatch, DL > standard, or sample count contradicts methodology. Honor `<DL`/ND/legend; the embedded limit table must name its CSR stage/date and never hard-fail against it (limits rot; 2017 champ used Stage 9). | CONFIRMED | L |
| R3 | ~~report_quality structural recount~~ | ✅ done Wave 0 | — |
| R4 | **Drainage-class vs profile-evidence coherence**: WARN when prose claims well/moderately-well drained while a parsed profile row logs explicit mottling ≤50 cm or gley/chroma≤2 tokens. Fire ONLY on explicit tokens in parsed tables (Munsell lives in free text — parse conservatively or it false-positives). | verified real+unguarded | M |
| R5 | **Promote exact-match KNOWN_STALE_REGS to HARD-fail** — a citation the system KNOWS is repealed should never save non-DRAFT. Exempt when the replacing reg is cited nearby ("repealed, replaced by 30/2019" history is legitimate). Closes the receipt-exists-but-currency-slipped seam. | verified; refined | S |
| R6 | **Canon-freshness sentinel** — NOT the auto-scraping cadence task (verifier killed it: auto-bumping Last-verified from flaky scrapes fabricates currency). Instead: doctor WARN when `regulatory-currency.md` Last-verified >120 d + a verify_report nudge when a report cites canon older than the last re-verify. Quarterly re-verify stays a prompted human session. | verified; refined | S |
| R7 | **KNOWN_STALE_SECTIONS map** — renumbered bylaw/reg sections (old→new) in regulatory-currency.md, mirrored into verify_substance; dedicated WARN, not buried in the 12-item currency aggregate. | verified | S |
| R8 | **type_specific_warns profiles for fqa + closure-memo** (then rma, reclamation): fqa = CSR results table present + per-parameter conclusions + sample-ID match; closure-memo = every approval condition addressed (needs a condition-list source — design note first). 8 of 10 types have zero type-specific checks today. | panel + partial verify | M |
| R9 | **Reviewer receipt: per-figure FIGURE-QA checklist line** (scale bar / north / cadastre-source / GPS-claim state, per figure) so the vision pass leaves proof. Salvaged from the killed furniture gate — deterministic gating of pixels is impossible; receipt-proof of the judgment pass is the right tool. | salvage | S |
| R10 | Terminal-section presence (Conclusions/Recommendations per spec) — **subsumed by R1**. Prioritized-recommendations quality stays reviewer judgment (prose-shape regexes false-positive). | — | — |
| R11 | Texture feel-vs-class WARN — PARKED: only defensible when one cell carries an explicit ribbon-length band AND a contradicting feel term; reviewer #LCA-module already catches this reliably. Revisit only if R4 ships clean. | risky | park |

Killed by verification (do not resurrect): figure-furniture caption/text gate; prose-NLP taxonomy validation (the
no-NLP gate doctrine is deliberate; reviewer SKILL:161 already mandates the prose check); "has been retained to"
regex; auto-bumping regulatory scraper. Queue one report-lessons line documenting that a profile with no parsed
table escapes the table checks (reviewer prose check is the only net) — in CANDIDATE-EDITS.

Also from the panel, larger-horizon (design-first, not scheduled): cross-document consistency (report claims vs
field notes / lab certificates / GIS on disk) — the most senior-grade gate of all, and the most complex; a
cover-letter/plain-language client summary skeleton chained after sign-off (partner-grade delivery framing).

## Wave A — finish the automation loop

Architect-chain findings, statuses verified against disk on 2026-07-02:

| # | Build | Why | Effort |
|---|-------|-----|--------|
| A1 | **Record the platform verdict + queue-usage ruling** (DECISION, not code — see Decisions below). | Blocks A2/A3 hosting + PROPAGATE's signal source. | S |
| A2 | **metrics.py fitness reader** — rolls captured signals into edit-rate per draft-type, reviewer-flag rate, approval latency, funnel leads→quotes→signed; one brief line; read-only, no gating thresholds. No metrics/fitness tool exists on disk. | The substrate PROPAGATE is judged against (DESIGN §4). | M |
| A3 | **PROPAGATE pipeline (`tas_propagate.py`)** — reads draft-edit + reviewer-flag signals, dedups vs lessons, distills a recurring correction into a TARGETED proposed edit to the governing skill/playbook, writes it to CANDIDATE-EDITS as a queued diff. NEVER auto-applies judgment/liability/client-facing edits; injection-safe (inbound email can never become a self-edit). | The keystone gap — "where recursive lives" (DESIGN §3). | L |
| A4 | **Durable CLI-OAuth refresh** — wire TAS-Reauth.py into a preflight/heal so headless `claude -p` never silently 401s (Mar-18 class); failed refresh blocks + reports, never proceeds. Detection (check_claude_cli_token WARN) already exists; the durable fix doesn't. | Protects briefs + any headless tier. | M |
| A5 | **Revenue-generator smoke tests** — TAS-Invoice-Generator, generate_quotation, TAS-Agreement-Generator, TAS-ALC-Package-Generator, TAS-Submission-Packager, make_client_draft: zero test coverage on the code that produces money and stamped deliverables. | A silent regression here breaks money or delivery. | M |
| A6 | **Baked-facts extraction** — move tas-bid-pipeline's "Phoebe $2M CGL / no bonding / no $ cap" + dq-outreach-engine's "10% commission + contacts" from SKILL prose into a referenced `partners` data file read at run time. The baked-facts lint is deliberately project-code-only, so these evade it by design — the fix is the facts-in-data convention, not a broader lint that cries wolf. | Exact Harvey failure mode on an AUTO-SUBMIT pipeline. | M |
| A7 | **Agreement sent→signed tracker** — weekly-business-review names unsigned fee proposals but not unsent-back agreements; add the check reading live project state. | An unsigned agreement silently stalls kickoff revenue. | S |
| A8 | **EOD split, then daily money line** — end-of-day SKILL is at 25,890 B against its 26 KB working ceiling and carries NO money section; split per the house module-split pattern, then add the BILL-READY line to the 5:30 pm brief. Zero-growth alternative shipping first: `check_unbilled_wip` doctor WARN ($6). | The daily brief Tish actually receives must carry cash state. | M |
| A9 | Report figure/appendix embedding in the generator — stays **deferred by design** (stamped-deliverable risk; design-first per CANDIDATE-EDITS). Do not rush. | — | L |

Housekeeping queue (CANDIDATE-EDITS / low-risk): archive TAS-Health-Check.py after porting its 2 legacy checks;
rename tas-quarterly-self-audit → monthly (re-register the scheduled task when renaming); split the worst
over-ceiling files (tas_signal.py 53.5 KB, verify_report.py 42.7 KB — same pattern as the health_checks split);
Gilmore 25.0152-vs-23.0152 code reconcile; email-lessons pointer fix (people/key-contacts.md).

## Wave $ — cash latency (the revenue lens)

| # | Move | Status |
|---|------|--------|
| $1 | Morning-brief BILL-READY line | ✅ done Wave 0 |
| $2 | **Issue Sun 26.0017 oversight-to-date + Cheema 26.0018 interim invoices** — tracker says both defensible now; generator + verify_invoice gate ready; Tish sets the figures. Bene 26.0023: verify against the live tracker before deciding. | TISH — today |
| $3 | **Lead-age clock** — surface first-response age on `Leads`-labeled threads in the brief (a metric, not a bot; email stays manual). | S |
| $4 | **Re-touch cadence list** — weekly: client-gated stalls (Li, Nagra, Zhang, Bains class) older than N days → ready-to-review nudge drafts. Draft-only, Tish sends. | S |
| $5 | **Quotation/fee-proposal gate** — verify_invoice mirror for quotes (already OPEN in the tooling backlog); pricing discipline before the client sees a number. | M |
| $6 | **check_unbilled_wip doctor WARN** — tracker has a billable-now row older than N days → session-start WARN naming top 3. Zero SKILL growth; pairs with/precedes A8. | S |

## Decisions for Tish (nothing below happens without you)

1. **Sun + Cheema invoices** ($2) — the single highest-$ item in this entire plan. Say the word and the drafts
   get generated same-day.
2. **Platform verdict (A1)** — the June-17 review never recorded an outcome. Evidence stands ready: Jun 11 clean
   miss; Jun 12 fired-but-incomplete; Jun 13-16 no probe rows at all (4 of 7 probe days produced nothing);
   prototype log's own conclusion: the gap is scheduler-firing, not Code capability. 15-minute session: keep or
   move the scheduled tier, and rule on whether tas_queue's decide-path is dead-by-design (you work per-file) so
   PROPAGATE reads draft-edit signals instead.
3. **Field-dispatcher trigger** — the Jul-1 self-audit says trigger #2 (native subagent fan-out / dynamic
   workflows) plausibly fired. Revisit the parked blueprint or re-park with a new trigger; not auto-built.
4. **Plugin reinstall** — 1.2.7 already awaits install; this session's reviewer-#17 + morning-brief edits ride
   the next build (1.2.8). One install ritual covers both.
5. **KNOWN_STALE_REGS → HARD (R5)** — narrows what can ship (never widens autonomy), but it changes gate
   semantics on stamped deliverables: your sign-off.
6. **mailFilters.xml import** (Gmail overhaul phase 2) + **3 placeholder projects** (26.0001/26.0008/26.0010
   backfill-or-hold) + **5 parked Gmail drafts** (oldest 19 d) — standing items the fleet re-confirmed.

## Explicitly NOT doing (locked or killed)

Email auto-drafter/watcher (locked 2026-06-15 — manual by choice) · auto-building the field dispatcher (parked →
decision #3) · portal/tas-hub investment while suspended (iPhone interim works; revisit at billing reset) ·
auto-scraping regulatory refresh (fabricates currency) · figure-furniture text gate (fires on every correct
figure) · prose-NLP taxonomy gates (deliberate doctrine) · re-running the fluked revenue judge (lifecycle
evidence already complete) · any <$50/yr refactor.

## Sequencing + measurement

Order: **$2 today (Tish)** → R5+R6+R7 as one small gate batch → R1 → A1 (decision) → A2 → R2 → R4 → A3
(PROPAGATE, the big one) → A5/A6/$3/$4/$5/$6 interleaved as session-sized pieces → R8/R9 with the next plugin
build → A4 → A8. Each R-build lands WARN-first with tests, per house doctrine.

It worked if, by September: editRate + reportQuality trend down on a live sample (integrity now guaranteed by R3);
unbilled-latency (days from billable→invoiced) drops from months to <7 d; zero external-callout-class recurrences;
gate false-positive rate stays ~0 (quiet-unless-right holds); and PROPAGATE has shipped ≥3 Tish-approved skill
edits from captured signals — the flywheel's first full turns.
