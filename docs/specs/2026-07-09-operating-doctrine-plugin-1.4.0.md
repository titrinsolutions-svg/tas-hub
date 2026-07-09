# Operating Doctrine + tas-operator-hats 1.4.0 — the judgment layer (2026-07-09)

**What Tish asked for:** "Upgrade the hats plugin 10X so drafting, analysis, and report writing run on the best
possible thought process and judgment regardless of which Claude model Cowork is using — and make the brain 10X
better for yourself."

**The one-line diagnosis after reading all 17 skills + the brain:** the system's *mechanics* were already heavily
railed (deterministic gates, draft-only invariants, blind review, receipts — the product of 15+ audits), but the
*thinking layer* was uneven: project-lead had a real pre-draft strategic review; email-responder, money-manager,
and the report writer went research → output with no explicit judgment-formation step. Quality on those paths
still depended on the model of the day. That was the gap.

## What shipped

### 1. The judgment core — `TITRIN/Claude/memory/operating-doctrine.md` (new brain file)
One page every hat now runs before consequential output:
- **The 6-step loop:** decision (name whose decision this output moves) → evidence (grade A–E; confidence
  language must match grade) → hostile reader (find the attackable sentence before an ALC reviewer / planner /
  competing consultant / opposing lawyer does) → risk triage (standing/stamp → client's regulatory position →
  relationship → cash → speed) → consistency (no silent position drift vs prior written TAS positions) →
  leverage (one-minute dominant-option hunt).
- **Evidence grades → language register** — the drainage-verb rule generalized to every claim TAS writes
  (measured / document-verified / inferred / expected / unknown), with the one unforgivable class named:
  stated certainty above evidence grade.
- **Canonical PRIORITY ORDER** for cross-file triage: hard deadlines → signed-work delivery + relationship →
  cash → pipeline → polish (morning-brief and the router now cite it; deadlines now outrank relationship —
  the irreversibility principle).
- **Escalation floor** — the situations where the hats stop and surface to Tish instead of proceeding.

It lives in the **brain, not the plugin**, so future judgment lessons land there via PROPAGATE without a
plugin rebuild.

### 2. All 17 hat skills upgraded (surgical, additive)
- Every skill points at the doctrine; heavyweight hats carry a compressed inline loop (belt-and-suspenders —
  the rails hold even if a model skips the reference read).
- **tas-report-writer PHASE 6.5 — "Form the professional opinion"** (the senior-agrologist upgrade): before any
  section is drafted, write the opinion ledger to `Draft/OPINION-LEDGER.md` — the regulatory question answered
  in 2–3 sentences, an evidence table (claim → source → grade), the weakest load-bearing link, a hostile-reader
  pass, and the integrity check (evidence doesn't support the client's desired conclusion → STOP and surface).
  PHASE 11 now leads delivery with the verdict + weakest link — the judgment trace Tish reviews first.
- **email-responder Step 3.5 — "Form the position"**: a 2–4 line written position (what they're asking, what the
  evidence supports, the position TAS takes, what we're deliberately NOT saying) surfaced with every
  non-logistics draft.
- **tas-report-reviewer check #18** — bounded confidence-vs-evidence calibration: flags text asserting a
  measured/verified basis the methods section doesn't support (the June-2026 callout class), while explicitly
  protecting honest inference language.
- Tailored one-block variants for fee-proposal (scope wording = future contract exhibit), agreement
  (fee-paper match above all), invoice (amount consistency), money-manager (graded payment claims; a reminder
  on a wrong "unpaid" is the hostile-reader failure), project-runner, business-development (graded regulatory
  claims in outreach), construction-bid, growth-and-web (public content = grade-B claims only), kickoff,
  process-brief, morning-brief, router, senior-report-review.

### 3. Antifragile enforcement (the part that makes it permanent)
`build_tas_plugin.py` gained two TDD'd build gates (25 tests green, including live nets over the shipped suite):
- **`kernel_problems()`** — any skill invoking `bridge_client.py draft` must carry the drafting-kernel
  invariants (end-body-at-sign-off / one-draft-per-thread / edit-rate snapshot) inline or name the kernel
  section. Kills the N-copies-drift class; it already caught one true positive (construction-bid).
- **`doctrine_problem()`** — no skill can ship without the judgment-core pointer.

### 4. Verified, not asserted
- Build tests 25/25 · doctor suite 162/162 · full doctor run: no FAILs; the brain-file-size warning my edits
  triggered was self-healed (report-writer PHASE 6 sharded to `references/site-plan.md`, 26.9 KB < 27 KB trip-wire).
- **Behavioral GREEN check:** a context-blind subagent ran the upgraded email-responder + doctrine against a
  planted-trap scenario (prospect asking for a no-evidence "the fill is good and the City will approve" letter).
  It hit the escalation floor, produced the graded position block, declined the unsupportable letter, refused
  the approval prediction, kept admission-neutral wording ("whether authorization was needed is to be
  confirmed"), quoted no fee (no prior), and closed with a written next step. 5/5 self-audit checks passed.
- `claude plugin validate` passed; description surface 11,906 / 15,000 budget (no always-loaded bloat).

### 5. My own brain (the second ask)
- `MEMORY.md` reorganized from a flat 51-item list into five scannable sections (standing rules & gates /
  how to work with Tish / the machine / live threads / field notes) — zero entries lost, two state corrections.
- Deliberately NOT built: a portfolio "next actions" parser tool — `active-projects.md` + `_BRIEF.md` packs +
  the morning brief already answer it; a parser would be a second interpretation layer that can drift
  (the marginal-refactors rule, honored).

## The ONE action for Tish
Install **`~/Downloads/tas-operator-hats-1.4.0.plugin`** in Cowork (Settings → Customize → Personal plugins →
REMOVE the old tas-operator-hats → add 1.4.0 → fully quit + reopen). **This supersedes the 1.3.0 install that was
pending from the hardening branch — one install now covers both.** The 1.3.0 file in Downloads can be deleted.

## Why this is the "regardless of model" answer
A smaller model walking the loop verbatim beats an unguided strong model on consistency; a strong model gets
better answers *inside* the same rails. The judgment protocol is now: written down once (doctrine), pointed to
from everywhere (17 skills + operator-map + TITRIN CLAUDE.md lookup), enforced at build time (gates), checked at
review time (check #18, PHASE 9), and it evolves without reinstalls (PROPAGATE target in the brain).
