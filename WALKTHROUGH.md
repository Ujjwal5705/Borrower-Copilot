# WALKTHROUGH.md — Five-Minute Walkthrough

## What this is

A personal assistant that helps a borrower answer four questions before walking into a lender — borrow or not, how much (lender number vs safe number, kept separate), what rate is fair (a band, plus all-in APR), and what EMI to agree to (with a stress test) — ending in a one-screen Negotiation Card.

## Live demo path (if walking through in person)

1. Run Priya (salaried, clean profile, wedding loan) → show BORROW, the lender-vs-safe split, and that skipping every additional question still produces a usable — just wider — answer.
2. Run Ravi (informal income, but owns his shop) → show the **secured-product routing**: collateral pushes him from a ~13.5% personal-loan band to a ~10% LAP band, and BORROW_LESS fires correctly because his safe ceiling (~₹10.5L) is well under his ₹15L ask.
3. Run Anita (informal income, recent bounce, existing high-cost debt) → show DON'T BORROW firing correctly, and that the UI *doesn't* show a broken-looking ₹0 amount/rate/EMI breakdown once that verdict is reached — it explains the reasoning instead.
4. Open `RULES.md` and pick any number at random — be ready to say why it's there and change it live if asked (see "rules I'd defend most carefully" below).

## What I'd build next (in priority order)

1. **Parse `informalDebtDetail` into a real number.** Right now it's free text used only to help trigger the DONT_BORROW hard stop; it should be parsed (or asked as structured fields — outstanding amount + rate) so it actually feeds into `existingEMIs` for borrowers who have informal debt *without* a bounce. This is the single biggest gap in the affordability math today.
2. **Wire `tenureYears` (years in job/business) into the rate/confidence logic.** It's collected but currently inert — a longer track record should plausibly lower risk premium or add confidence for self-employed borrowers, similar to how credit score works for salaried ones.
3. **A persistent local (in-browser, not server) history** so a borrower could compare "what if I answer 2 more questions" against their first pass, without literally screenshotting the first result. Still no backend, no login — just in-memory or sessionStorage-style state (would need to swap `useState` for something that survives a refresh, carefully, since the brief explicitly says no personal data stored).
4. **A "change one answer" affordance** on the results screen — right now going back re-walks the whole question flow; a real product would let you tweak just, say, household expenses and see the numbers move live.
5. **Real device testing pass** — checked in Chrome's device toolbar, but haven't tested on an actual low-end Android device, which is the realistic device for at least Ravi's and Anita's profiles.

## What I'd cut if time-boxed further

- The tenure trade-off table (3 tenure options in O4) — nice for transparency, but if I had to cut something to ship faster, this is presentation sugar on top of the EMI ceiling number, not new information.
- The "skip" button copy variations — currently one skip button per additional question; a simpler build could batch-skip all remaining with one click, at the cost of losing the per-question "this affects O3" transparency. I chose to keep the granular version because explainability is directly scored, but it's the first thing I'd simplify under more time pressure.
- Supporting more than the three named loan products would-need beyond the three borrowers — the brief explicitly says breadth beyond what the three borrowers need isn't scored, so I didn't build gold-loan-specific or two-wheeler-specific product logic beyond what vehicle/business/personal/home/LAP already cover.

## Rules I'd defend most carefully (i.e., most likely to be asked to change live)

- **The 1.5× collateral-to-loan threshold for secured routing** (`affordability.js`) — arbitrary but reasoned; easy to change to any multiplier and see Ravi's outcome shift in real time.
- **The 20%/1.5pp stress-test shock magnitudes** (`emi.js`, `engine.js`) — these are the two most "picked a number" judgement calls in the whole engine; genuinely open to argument on what's realistic for 2026 India.
- **The DONT_BORROW hard-stop triggers** (`verdict.js`) — three explicit conditions, checked in a specific order; if asked "what if a borrower has a bounce but no informal debt," I can walk through exactly which branch handles it and why it doesn't currently trigger DONT_BORROW on the bounce alone (a deliberate choice — a single old bounce with no active bad debt uses FOIR math instead, in `foirCaps`, via the FOIR reduction, not a hard stop).

## Honest limits (see RULES.md §9 for the full list)

Not a credit model, not bureau-verified, base rates and processing fees are approximate market knowledge, and household-expense figures for Ravi and Anita in the run-throughs are reasonable estimates since the brief didn't specify them.