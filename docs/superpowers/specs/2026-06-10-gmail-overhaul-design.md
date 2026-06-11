# TAS Gmail Overhaul — System Design

**Date:** 2026-06-10 · **Status:** awaiting Tish approval · **Author:** Claude (solo design per Tish's instruction)
**Scope:** complete reorganization of titrinsolutions@gmail.com + the ongoing machine-run maintenance loops. Design only — no mailbox mutations until approved.

---

## 1. Platform decision

**Build (one-time overhaul): Claude Code Desktop, interactive session in tas-hub.**
- The Gmail connector with full label tooling (`list/create/update/delete_label`, `label/unlabel_thread`, incl. system labels → archiving) is connected and verified working in this session.
- Bulk backfill is best done with local Python against the Gmail API (`batchModify`, ~100 ids/call) — native here; in Cowork every host-side step routes through bridge_client.
- Artifacts (this spec, filter XML, backfill scripts, open-loops report) land in the repo with history.
- A long interactive Cowork session would contend with the scheduled tasks' lock window; a Code session doesn't hold that lock.

**Operate (daily): Cowork, unchanged.** The scheduled tasks (morning brief, end-of-day-update) and on-demand hats (email-responder, project-lead, business-development, money-manager, tas-kickoff) are the system's consumers; they get small SKILL addenda (§6). Moving daily ops to Code remains a separate stack-simplification decision (see platform memory) — not needed for this.

## 2. Evidence base (recon 2026-06-10, read-only)

- **38 user labels, two generations:** ad-hoc per-property labels ("14561 Westminster Hwy - Colin") and a structured `TAS Projects/26.XXXX - Name` convention that stops at **26.0011** — the business is at **26.0026**, so ~15 projects have no label. A parallel system half-exists; this design completes and unifies it rather than inventing a new one.
- **Money labels exist but misfire:** "Payments Received" and "Receipts ALC NOI/ CITY Apps" are applied inconsistently (an incoming Keane e-transfer filed under Receipts; an outbound transfer to Hai Lun Zhou under Receipts; a $3,500 e-transfer receipt sitting **unread** in the inbox since May 20).
- **Drafts rot silently:** 4 drafts found — two fresh (Jun 10), but the **Rav Bains QEP scope/fee ($4,000) unsent since Jun 8** and the **TAS Invoice Check digest (≈$48k outstanding, incl. JKCE $21,525) unsent since Jun 5**. Nothing surfaces parked drafts today.
- **Noise lives in the inbox:** Vercel/Render/Ollama/Dropbox/OANDA/HUB newsletters + TD surveys sit unread in the inbox the morning brief reads — token waste and signal dilution every day.
- **ALC has no own domain:** `from:alc.gov.bc.ca` returns nothing; ALC staff (Roy Biedrava, Katarina Glavas) mail from **@gov.bc.ca**. Filters must target gov.bc.ca, not an ALC subdomain.
- **Richmond is the top counterparty;** Mike Morin's subjects carry City file numbers (`CD 203214 … - TT`) — highly filterable. Coquitlam is both client and an RFQ stream (fencing quotations forwarded to Phoebe/QY).
- **CRA payroll mail** (PD7A, account RP0001) arrives from cra-arc.gc.ca — deadline-critical, must never be buried.
- **TAS Brief self-emails** land in the inbox and linger.
- **Mailbox is ≥13 months deep** and early threads became live files (the May-2025 "Apply PA Service" inquiry is now 26.0003 JKCE) — history labeling has liability value (standing rule: search Gmail for address history before writing).
- Exact thread counts unavailable from the connector (estimate caps at 201); measured at execution.

## 3. Design principles

1. **Labels are routing + state for the agent ecosystem** (the primary consumer), not a human filing cabinet. A label exists only if an agent (or Tish's phone) queries it — otherwise it's deleted.
2. **Truth lives in the tracker** (active-projects.md / everlasting tracker), never in labels. Labels index; agents verify by reading the thread before acting (Harvey lesson, 2026-06-05).
3. **Inbox = untriaged only.** Triaged mail is labeled and archived. Presence in inbox means "no decision yet."
4. **Deterministic first:** Gmail filters route at arrival for free; agents classify only the residue.
5. **Lean:** ~12 fixed labels + one per project. No deep trees. Gmail search does the rest.

## 4. Label taxonomy

### State layer (`@` sorts to top; applied/removed by agents)
| Label | Meaning | Lifecycle |
|---|---|---|
| `@Action` | Ball with Tish: reply / decide / sign / pay | Set at triage; cleared when his reply/action lands in the thread |
| `@Waiting` | TAS sent; awaiting other party | Set at send when a response is owed; stale >5 business days → chase list |
| `@Drafted` | A Claude draft is parked on this thread | Set at draft time; brief surfaces it daily with age; cleared on send |

### Pipeline
| Label | Meaning |
|---|---|
| `Leads` | Every inbound inquiry thread (+`@Action` on arrival). Stays on the thread after conversion (funnel history). `Leads/Cold` for explicitly dead. |

### Projects (keep + extend the existing convention)
- `TAS Projects/26.XXXX - <Short name>` — one per file, created at kickoff, kept forever. Backfill creates the missing ~15 (26.0012–26.0026) and merges old per-property duplicates into the numbered label. Confirmed merges: 16960 River Rd→26.0007, 9431 Finn Rd→26.0008, 10491 Granville→26.0011, 10220 Blundell (Helen/Leo/Luniu)→26.0009, 6020 No.4 Rd (Jessica Sun)→26.0017, Colwood NFU/Exclusion→26.0004, 7251 Sidaway→26.0019; remainder mapped against the tracker at execution.
- Pre-numbering history that maps to no file: rename under `TAS Projects/Pre-2026/<address>` (rename re-files instantly; zero data risk).
- Keep as-is: `TAS - Templates`, `Company info and Docs`, `Resources/Bulletins`.

### Counterparties (pure domain filters, zero maintenance)
| Label | Filter |
|---|---|
| `Gov/ALC & Province` | from:gov.bc.ca |
| `Gov/Richmond` | from:richmond.ca |
| `Gov/Coquitlam` | from:coquitlam.ca |
| `Gov/Other Municipal` | from:(delta.ca OR colwood.ca OR pittmeadows.ca OR …) — list grows as they appear |

### Money (repair the two existing labels)
| Label | Contents | Source |
|---|---|---|
| `Money/Received` | Incoming e-transfers, payment confirmations | rename of "Payments Received"; filter notify@payments.interac.ca — never skips inbox |
| `Money/Paid & Receipts` | Outbound transfers, ALC/City app-fee receipts, vendor receipts | absorbs "Receipts ALC NOI/ CITY Apps"; filter catch@payments.interac.ca + receipt senders |
| `Money/CRA & Bank` | CRA (PD7A, GST, corp tax), TD e-statements | filter cra-arc.gc.ca (+`@Action` by agent; never skips inbox), td.com statements |

### Ops & noise
| Label | Contents | Behavior |
|---|---|---|
| `Ops/Briefs` | TAS Brief self-emails + digest drafts | filter from:me to:me "TAS Brief"; end-of-day archives yesterday's |
| `zNews` | Newsletters, promos, surveys (sender list from backfill) | **skip inbox** + label; weekly one-line skim in Monday brief for the first month; unsubscribe shortlist produced at backfill |

## 5. Filters

~8 fixed filters (table above) + one per **active** project: `from/to participants OR "address" OR CD#### OR NOI#####` → project label. Created at kickoff, deleted at closeout (label stays). ~25 total; Gmail's limit is 1,000.

**Install path:** the connector has no filter API → I generate `mailFilters.xml`; Tish imports via Gmail Settings → Filters → Import (~2 minutes, one time). Fallback: one-time OAuth re-auth of the local CLI token adding `gmail.settings.basic` and I create them via API. Safety rule: **skip-inbox is sender-based only (zNews), never keyword-based** — a real client mail can't be silently hidden.

## 6. Agent wiring (the loops that make it stick)

| Loop | Runs | Addendum |
|---|---|---|
| Morning brief | daily, scheduled (Cowork) | Read `in:inbox -label:zNews`. Classify residue (project match via tracker/_BRIEF), set `@Action`, draft confident replies (+`@Drafted`), archive pure-FYI after labeling. Brief sections: @Action queue · @Drafted with ages · @Waiting stale >5bd · new Leads. |
| Send time | email-responder / project-lead / interactive | Ensure project label on thread; clear `@Action`; set `@Waiting` when a reply is owed; sending clears `@Drafted`. |
| End of day | daily, scheduled | Sweep `in:inbox has:nouserlabels` → classify; archive yesterday's `Ops/Briefs`; stamp `@Waiting` by who-holds-the-ball from the thread itself. |
| Weekly chase | business-development | Query `label:@Waiting older_than:5d` + `label:Leads -label:TAS-Projects` → value-led chase drafts. |
| Monthly money | money-manager | Reconcile `Money/Received` vs invoice ledger; check `Money/CRA & Bank` deadlines. |
| Kickoff / closeout | tas-kickoff | Create project label + filter at file opening; delete filter (keep label) at closeout. |

SKILL edits land in canonical locations: scheduled tasks in `Documents\Claude\Scheduled` (then mirrored to repo); hats in `TITRIN/Claude/.claude/skills/`.

## 7. Backfill plan (one-time, this Claude Code session)

- **Pass 1 — deterministic bulk:** domain/sender searches → Money, Gov, zNews, Ops/Briefs labels. Local Python (`gmail.modify`, batchModify) preferred; MCP `label_thread` loop is the fallback for moderate volumes. Check `~/.tas/gmail` token scopes first; re-auth once if needed (secrets stay in `~/.tas/`).
- **Pass 2 — projects:** per file, search participants/address/CD#/NOI# → project label; execute the merge map (§4); park unmatched history under `Pre-2026/`.
- **Pass 3 — the open-loops audit (the real payoff):** flag every thread where the last message is inbound and unanswered >7 days, every parked draft, every received payment unmatched to an invoice. Output: **OPEN-LOOPS report** for Tish.
- **Pass 4 — archive sweep (gated):** only after Tish reviews the report — everything labeled, read, and >30 days old leaves the inbox. Archive ≠ delete; fully reversible; recent mail stays put.
- **Byproduct:** zNews unsubscribe shortlist.

## 8. Rollout & gates

1. **Phase 1 (on "go," ~1h):** create/rename labels; generate filters.xml; label the last 60 days so the system is immediately live.
2. **Phase 2:** backfill passes 1–2 + open-loops audit report.
3. **Phase 3:** agent wiring (§6).
4. **Phase 4 (supervised week):** brief runs on the new structure; measure inbox residue + stale-@Waiting count weekly; tune.

**Hard gates:** no archiving before Tish reviews the open-loops report · nothing is ever sent · filters via XML import unless Tish prefers the re-auth path.

## 9. Risks / honest tradeoffs

- **Label rot vs reality** → labels are routing only; truth stays in the tracker; agents read the thread before acting.
- **Backfill mislabels a few percent** → harmless: search is unaffected, labels are cheap to fix.
- **Skip-inbox could hide signal** → sender-based only + weekly zNews skim the first month.
- **The discipline holds only if the loops run** → they already run (scheduled tasks); Tish's behavior change is ~zero: read the brief, work `@Action`.

## 10. Success metrics (weekly, into the tracker)

- Inbox residue at end of day (target: ≤ a screenful, trending to ~0).
- Stale `@Waiting` >5bd count (each one is a chase opportunity, not a slip).
- `@Drafted` max age (target: <2 days — would have shipped the Rav quote and the $48k chase list).
- Morning-brief token cost (should drop once zNews skips the inbox).

## 11. North-star alignment (added after VISION.md + HANDOFF-2026-06-10 review)

Checked against the 9 VISION principles and this morning's fresh-eyes audit. Verdict: **advances the dream goal; no conflicts.** Specifics that now bind this design:

- **Labels are a DERIVED, self-healing index — never a second source of truth** (principle 6). Project status truth = the tracker; ball-state truth = the live thread (who-holds-the-ball). The daily sweep re-derives `@Action`/`@Waiting` from the thread itself; labels never feed reports, invoices, or decisions directly — they only route attention. Drift is tolerated and self-corrects within a day.
- **Antifragile guard (principle 5):** Phase 3 adds a doctor check `check_gmail_routing` — every tracker-active project has its label + filter; `@Drafted` max-age alert; flag if a known client/regulator address ever matches a zNews skip-inbox rule. The new surface ships with its own rot detector.
- **Platform-neutral by construction (handoff shape-01):** the structure lives in Gmail (labels + filters), not in any runtime. If the Code-Desktop platform prototype ends Cowork lock-in, everything carries over; only the small SKILL addenda re-home. The overhaul *reduces* future migration cost by moving routing from prose-in-skills to deterministic filters.
- **No new actuation surface (handoff Critic on MCP connectors):** the build uses read + label-write only; the XML filter-import path adds zero new grants or scopes. Hard invariants (never send / never move money / never stamp) untouched.
- **Bounded-HOT / unbounded-COLD (principle 3):** the inbox is the hot path the morning brief pays tokens on every day; triage-then-archive + zNews skip-inbox keep it bounded while the archive grows cold and unbounded. This is the brain's bounding discipline applied to the mailbox.
- **Roadmap placement (principle 8 + handoff Critic #3):** this is SENSE/QUEUE substrate plus a direct chase of ~$48k already-identified receivables — but it does NOT displace the P0 output-quality items (hands-03/04, brain-04, hands-09) or the website instrumentation (the #1 revenue lever). Build happens in a Claude Code side-session; Tish's cost stays ~2 minutes + one report review.

## 12. Decision log

- Build in Claude Code, operate in Cowork (§1).
- Filters via XML import, not new OAuth scope (least-credential path; fallback documented).
- Conservative archive policy: gated on open-loops review; 30-day recency floor.
- Keep + extend the existing `TAS Projects/26.XXXX` convention rather than inventing a new scheme.
- Closed-project labels are kept flat (no `Closed/` re-nesting churn); active/closed status lives in the tracker only.
