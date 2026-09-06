# RULES.md — Borrower Copilot

Every threshold, band, and assumption used by the rules engine, with its source. Where a number isn't from a published source, it's marked **"our judgement"** — meaning it's a defensible starting point we can change live, not a fact we're claiming is authoritative.

Code references point to the file that owns each rule, so this document can be checked against the code directly.

---

## 1. Product routing (`src/rules/affordability.js` → `routeProduct`)

| What | Value | Why | Source |
|---|---|---|---|
| Secured-route threshold | Collateral ≥ 1.5× requested amount | Below this, the collateral cushion isn't large enough to reliably beat an unsecured product on rate/sanction | Our judgement |
| Vehicle purpose → vehicle loan | Always, regardless of collateral | Vehicle loans are secured by the vehicle itself and are structurally cheaper than personal loans for the same purpose | Market convention |
| Business purpose + no collateral → unsecured business loan | — | No asset to secure against | Our judgement |
| Home purchase/improvement → home loan | Always | Cheapest secured category; lenders allow the highest FOIR for it | Market convention |
| Default (wedding/medical/education/debt consolidation/other) | Unsecured personal loan | Standard financing route for these purposes in India | Market convention |

## 2. Income recognition (`src/rules/affordability.js` → `lenderRecognizedIncome`, `safeRealisticIncome`)

| What | Value | Why | Source |
|---|---|---|---|
| Salaried income, lender-recognized | 100% of stated | Verifiable via salary slips/bank statements | Standard lending practice |
| Self-employed formal + ITR filed | 100% of stated | ITR is accepted proof | Standard lending practice |
| Self-employed formal + no ITR | 50% of stated | Lenders discount undocumented income heavily | Our judgement |
| Self-employed/gig informal + ITR filed | 70% of stated | Partial documentation reduces but doesn't eliminate the haircut | Our judgement |
| Self-employed/gig informal + no ITR | 30% of stated | Little to no lender-recognizable proof | Our judgement |
| Safe-income variable-share haircut | Up to 25% extra, scaled by `variableIncomeShare / 100` | Safe planning should use a conservative month, not an average one | Our judgement |
| Co-applicant income | Added at 100% to both lender and safe income | Standard household-income practice for joint applications | Standard lending practice |

## 3. FOIR (Fixed Obligation to Income Ratio) caps (`src/rules/affordability.js` → `foirCaps`)

| What | Value | Why | Source |
|---|---|---|---|
| Lender FOIR — salaried, unsecured | 50% | Common industry ceiling for unsecured lending to salaried borrowers | Market convention (approximate) |
| Lender FOIR — secured products | 65% | Collateral backing allows a higher ceiling | Market convention (approximate) |
| Lender FOIR — self-employed formal | 45% | Slightly tighter due to income variability even with ITR | Our judgement |
| Lender FOIR — informal income | 35% | Conservative, absent collateral | Our judgement |
| Lender FOIR reduction for recent bounce | −10 percentage points | A recent missed payment is a strong risk signal a static FOIR % doesn't capture | Our judgement |
| Lender FOIR floor | 15% (never goes below) | Sanity guard against negative/zero bands | Our judgement |
| Safe FOIR — salaried | 40% | Standard affordability guideline used broadly in personal finance | Common financial-planning guideline |
| Safe FOIR — informal/variable income | 30% | Can't smooth a bad month the way a fixed salary can | Our judgement |
| Safe FOIR reduction for recent bounce | −5 percentage points | Household is demonstrably already near its limit | Our judgement |
| Safe FOIR reduction for <1 month emergency savings | −5 percentage points | No buffer means less room for any new fixed obligation | Our judgement |
| Safe FOIR floor | 15% | Sanity guard | Our judgement |
| Safe EMI additionally bounded by (income − household expenses − existing EMIs) | Whichever of this or the FOIR-% bound is tighter | Prevents an EMI that's technically FOIR-compliant but leaves nothing for essentials | Our judgement |

## 4. Interest rate (`src/rules/rate.js`)

| What | Value | Why | Source |
|---|---|---|---|
| Base rate — home loan | 8.5% | Approximate 2025-26 Indian market band | Market knowledge (approximate) |
| Base rate — LAP/gold | 10.5% | ″ | ″ |
| Base rate — vehicle loan | 9.5% | ″ | ″ |
| Base rate — secured business loan | 11.5% | ″ | ″ |
| Base rate — unsecured business loan | 15.5% | ″ | ″ |
| Base rate — personal loan (unsecured) | 13.5% | ″ | ″ |
| Credit score ≥750 | −1.0 pp | Strong-profile discount | Our judgement |
| Credit score 700–749 | No adjustment | Standard band | Our judgement |
| Credit score 650–699 | +1.0 pp | Moderate risk premium | Our judgement |
| Credit score <650 | +2.5 pp | Higher risk premium | Our judgement |
| Credit score unknown | No center adjustment; widens band instead | Unknown ≠ bad (must not zero-out or penalize an unverified score) | Explicit brief requirement (rule 3) |
| Card utilization >70% | +0.75 pp | Signals stress not yet reflected in score | Our judgement |
| Recent bounce | +2.0 pp | Weighted above a stale credit score — recency matters more | Our judgement |
| Collateral ≥2× loan amount (secured products) | −0.5 pp | Extra pricing discount for strong over-collateralization | Our judgement |
| Rate band half-width | 1.0 pp × confidence-width-multiplier × 0.6 | Rate bands are naturally narrower in absolute terms than amount bands | Our judgement |
| Processing fee — home loan | 0.5% | Approximate market rate | Market knowledge (approximate) |
| Processing fee — LAP/gold, vehicle | 1.0% | ″ | ″ |
| Processing fee — secured business | 1.5% | ″ | ″ |
| Processing fee — personal loan | 2.0% | ″ | ″ |
| Processing fee — unsecured business | 2.5% | ″ | ″ |
| APR calculation method | Bisection search for the monthly rate that discounts the EMI stream to net-disbursed principal | Standard effective-rate approach; not an RBI-published formula, our own approximation of "all-in cost" intent | Our judgement (method), RBI disclosure *intent* (motivation) |

## 5. Confidence & band widening (`src/rules/confidence.js`)

| What | Value | Why | Source |
|---|---|---|---|
| Confidence score | (relevant additional questions answered) ÷ (relevant additional questions that apply) | Measures how much of the optional, range-narrowing information was actually provided | Our design, per brief rule 2 |
| Width multiplier at confidence 1.0 | ×1.0 (tightest) | Full information → no artificial widening | Our judgement |
| Width multiplier at confidence 0.0 | ×2.2 (widest) | No optional information → bands roughly double | Our judgement |
| Width scales linearly between | — | Simplicity; no basis for a nonlinear curve | Our judgement |
| Unknown credit score | Additional +0.15 to width multiplier | Score is a must-question; leaving it unresolved is a distinct, larger uncertainty than skipping an optional question | Our judgement |
| Must-question-only completion | Confidence floor, not confidence zero | Matches brief wording: must-only still "works, with wide ranges and low confidence" | Explicit brief requirement |

## 6. Verdict (O1) (`src/rules/verdict.js`)

| What | Value | Why | Source |
|---|---|---|---|
| Hard stop 1: recent bounce + informal debt detail present | → DONT_BORROW | New debt is very unlikely to fix an existing cash-flow crisis; overrides FOIR math | Our judgement, directly targets the Anita case in the brief |
| Hard stop 2: safe EMI capacity ≤ 0 | → DONT_BORROW | No room in the budget for any obligation | Our judgement |
| Hard stop 3: requested amount > 3× lender ceiling, no collateral | → DONT_BORROW | The ask itself is disconnected from what any mainstream lender would offer; pursuing it invites predatory lenders | Our judgement |
| Requested amount > safe ceiling (no hard stop triggered) | → BORROW_LESS, with % reduction shown | Directly answers "how much less" rather than a bare warning | Our judgement |
| Otherwise | → BORROW | Amount fits within the safe ceiling | — |
| Order of checks | Hard stops checked before the amount-vs-ceiling comparison | A technically-affordable ask can still be unsafe given active repayment stress | Our judgement |

## 7. EMI & stress test (O4) (`src/rules/emi.js`, `src/rules/engine.js`)

| What | Value | Why | Source |
|---|---|---|---|
| Tenure options shown | Product default −2, default, default +2 years | Gives a visible EMI/total-interest trade-off without overwhelming choice | Our judgement |
| Stress case — income drop | 20% | Common job-loss/slow-season shock magnitude | Our judgement |
| Stress case — rate rise | +1.5 percentage points | Plausible magnitude for a rate-hike cycle on a floating-rate loan | Our judgement |
| Stress "unsafe" threshold | EMI > 50% of stressed income | Reuses the general FOIR-danger-zone convention | Our judgement |

## 8. Amount-to-use selection (`src/rules/engine.js`)

| What | Value | Why | Source |
|---|---|---|---|
| Rate used to size amount bands | Center of the computed rate band | A single rate is needed for EMI↔principal conversion; using the center avoids biasing toward either edge | Our judgement |
| Amount shown in APR/EMI sections | min(requested amount, recommended band's high) | Keeps the Negotiation Card grounded in an achievable number, never the raw ask if that exceeds what's realistic | Our judgement |

## 9. Known limitations / what we don't model

- **`tenureYears` (years in job/business)** is collected as a must-question but is **not currently used** by any rule. It should ideally feed into confidence or the self-employed rate/FOIR adjustment (longer track record = lower risk); flagged here rather than silently ignored, per the brief's "honesty about limits" criterion.
- **Informal debt (`informalDebtDetail`)** is captured as free text and used only to help trigger the DONT_BORROW hard stop when combined with a recent bounce. It is **not parsed into a structured monthly-EMI estimate**, so for informal borrowers with real debt burden but no bounce, `existingEMIs` may understate their true obligations. This is the single biggest known gap in the affordability math.
- **No real bureau data** — credit score is entirely self-reported, as required by the brief ("no bureau pull").
- **APR calculation** is our own bisection-based approximation of effective annual cost, not a formula sourced from RBI documentation. It captures the intent (fold in fees) but shouldn't be quoted as regulator-verified.
- **Base rates and processing fees** are approximate market bands from general knowledge, not pulled from any specific lender's published rate card, and will drift out of date over time.
- **Confidence widening multipliers** (1.0× to 2.2×, linear) are a reasonable, defensible starting shape — not derived from any statistical backtest, since no real outcome data exists for this exercise.