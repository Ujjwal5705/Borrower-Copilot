# Borrower Copilot

A self-assessment tool that helps an Indian borrower answer four questions before walking into a lender:

1. **Should I borrow at all?** — a clear verdict (Borrow / Borrow less / Don't borrow), with a one-sentence reason.
2. **How much am I really eligible for?** — the lender's likely sanction number *and* the borrower's safe number, shown separately.
3. **What is a fair rate for me?** — a band, plus the all-in APR including processing fee.
4. **What EMI should I agree to?** — a monthly ceiling, tenure trade-off, and a stress test.

...ending in a one-screen **Negotiation Card** the borrower can hold up against a lender's quote.

No login, no bureau pull, no backend, no personal data stored — everything runs client-side from what the borrower types in, for the current session only.

## Stack

React + Vite (TypeScript project template, plain-JS rule files). No backend.

## Run it locally

Requires [Node.js](https://nodejs.org) 18+ and npm.

```bash
git clone <this-repo-url>
cd borrower-copilot
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). That's it — no environment variables, no database, no API keys.

## Project structure
src/
rules/ ← the actual lending logic (no React, no UI). Pure functions, independently testable.
questions.js — must-question and additional-question bank, adaptive routing (appliesWhen)
confidence.js — turns "how much was left unanswered" into a band-widening multiplier
affordability.js — product routing, FOIR caps, lender-vs-safe income, O2 (max amount)
rate.js — O3 (rate band) + all-in APR calculation
emi.js — O4 (EMI ceiling, tenure trade-off, stress case)
verdict.js — O1 (borrow / borrow less / don't borrow)
engine.js — orchestrates all of the above into one result object
hooks/
useAssistant.js — React state: tracks answers, current question, phase (must / additional / results)
components/
QuestionFlow.jsx — drives the must-question → additional-question sequence
QuestionInput.jsx — renders the right input control per question type
ResultsScreen.jsx — renders O1–O4
NegotiationCard.jsx — the one-screen printable/holdable summary
App.tsx — top-level wiring


The rules engine (`src/rules/`) is deliberately framework-free. It can be run and tested directly from the command line without touching React — see `RULES.md` for every threshold and assumption it uses, with sources.

## Deliverables in this repo

- `RULES.md` — every rule, threshold, band, and assumption, with a "why" and a source (or "our judgement").
- `RUNTHROUGHS.md` — the three required borrower run-throughs (Priya, Ravi, Anita): questions asked, all four outputs, and the Negotiation Card for each.
- `WALKTHROUGH.md` — five-minute walkthrough notes: what we'd build next, what we'd cut.

## Known limitations

See the "Known limitations" section at the end of `RULES.md`. Short version: `tenureYears` (years in job/business) is collected but not yet used by any rule; informal debt is captured as free text rather than parsed into a structured EMI estimate; base rates and processing fees are approximate market knowledge, not a live rate card.