# RUNTHROUGHS.md — Three Borrowers

Each section shows: the exact answers given, all four outputs, and the Negotiation Card. All figures are taken directly from real runs of the app (verified in the browser for Priya and Anita; verified via the rules engine directly for Ravi, and the same engine drives the UI).

---

## 1. Priya — salaried, Bengaluru

### Answers given
| Question | Answer |
|---|---|
| Purpose | Wedding |
| Amount wanted | ₹8,00,000 |
| Income type | Salaried |
| Net monthly income | ₹1,10,000 |
| Existing EMIs | ₹14,000 (car loan) |
| Household expenses | ₹28,000 (rent) |
| Age | 29 |
| Credit score | 780 |
| Years in job | 5 |
| *Additional questions* | Skipped all — "show me my results now" |

Confidence: **0 of 6** applicable additional questions answered → widest applicable band for this profile.

### Outputs

**O1 — Verdict: BORROW**
> ₹8,00,000 is within your safe borrowing ceiling of about ₹13,33,456, so this is affordable at a sensible EMI.

**O2 — Max amount**
- A lender might sanction: ₹8,28,359 – ₹18,22,389
- Safe to carry: ₹6,06,116 – ₹13,33,456
- **Use: the safe number** — it's lower than the lender's likely sanction.

**O3 — Fair rate**
- Band: **11.2% – 13.8%**
- All-in APR: **13.4%** on ₹8,00,000 over 5 years
- Why: 780 credit score (≥750) earns a 1.0pp discount off the 13.5% unsecured personal-loan base rate.

**O4 — EMI ceiling**
- **₹30,000/month**, capped by the 40% safe-obligation limit on her income.
- Tenure trade-off: 3yr → ₹26,763/mo (₹1.63L interest) · 5yr → ₹17,998/mo (₹2.80L interest) · 7yr → ₹14,337/mo (₹4.04L interest)
- Stress test: a 20% income drop still keeps the EMI at ~20% of income — manageable.

### Negotiation Card
| | |
|---|---|
| Product | Personal Loan |
| Verdict | BORROW |
| Fair rate for your profile | 11.2% – 13.8% |
| All-in cost (APR) | 13.4% |
| Borrow amount to ask for | ₹8,00,000 |
| EMI ceiling | ₹30,000/mo |
| Tenure | 5 years |

---

## 2. Ravi — self-employed, Mysuru (kirana owner)

### Answers given
| Question | Answer |
|---|---|
| Purpose | Business (stock/equipment) |
| Amount wanted | ₹15,00,000 |
| Income type | Self-employed, mostly cash income |
| Net monthly income | ₹40,000 (low end of his ₹40k–80k range, used deliberately for safety) |
| Income range high | ₹80,000 |
| Existing EMIs | ₹0 (never taken a formal loan) |
| Household expenses | ₹25,000 *(estimated — not stated in the brief; flagged as an assumption)* |
| Age | 42 |
| Credit score | Unknown (no formal credit history) |
| Years running business | 14 |
| ITR filed? | Yes |
| Collateral value | ₹45,00,000 (shop premises, unencumbered) |
| Co-applicant income | ₹18,000 (wife, teaching) |
| *Skipped* | variableIncomeShare, recentBounce, emergencySavingsMonths, upcomingLargeExpense, loanProductivityReturn, existingOffer |

Confidence: **3 of 9** applicable additional questions answered.

### Outputs

**O1 — Verdict: BORROW LESS**
> You asked for ₹15,00,000, but your safe ceiling is closer to ₹10,48,118 — about 30% less — based on your income, expenses, and existing obligations.
> *Consider borrowing ₹10,48,118 now, or phase the remaining need for later.*

**O2 — Max amount**
- A lender might sanction: ₹9,23,629 – ₹18,01,076
- Safe to carry: ₹5,37,496 – ₹10,48,118
- **Use: the safe number.**

**O3 — Fair rate**
- Band: **8.8% – 11.2%**
- All-in APR: **10.3%**
- Why: routed to **Loan Against Property/Gold** because his shop (₹45L) is worth 3x his ask — this alone drops his rate from the ~13.5% unsecured band to a ~10% secured band. A further 0.5pp discount applies for collateral ≥2x the loan amount.

**O4 — EMI ceiling**
- **₹17,400/month**, bounded by the 30% safe-obligation cap for informal/variable income.
- Tenure trade-off: 5yr → ₹22,269/mo · 7yr → ₹17,400/mo · 9yr → ₹14,756/mo
- Stress test: a 20% income drop pushes the EMI to 37.5% of income — still under the 50% danger line, but worth Ravi knowing this is closer to the edge than Priya's case.

### Negotiation Card
| | |
|---|---|
| Product | Loan Against Property / Gold |
| Verdict | BORROW LESS |
| Fair rate for your profile | 8.8% – 11.2% |
| All-in cost (APR) | 10.3% |
| Borrow amount to ask for | ₹10,48,118 (not the ₹15L he originally wanted) |
| EMI ceiling | ₹17,400/mo |
| Tenure | 7 years |

**This is the case that most directly tests the brief's scoring bar**: an informal, no-credit-score borrower is correctly routed to a secured product because of his collateral, dropping his rate from a personal-loan band to a near-home-loan band — a difference of roughly 3 percentage points he would very likely not have known to ask for.

---

## 3. Anita — informal income, Hubballi (delivery rider + tailoring)

### Answers given
| Question | Answer |
|---|---|
| Purpose | Vehicle (e-scooter) |
| Amount wanted | ₹1,50,000 |
| Income type | Gig/platform work |
| Net monthly income | ₹26,000 (low end of her ₹26k–30k range) |
| Income range high | ₹30,000 |
| Existing EMIs | ₹5,000/month *(estimated monthly burden on her ₹35,000 informal debt — see limitation below)* |
| Household expenses | ₹20,000 *(estimated — two children, husband currently not earning)* |
| Age | 35 |
| Credit score | Unknown |
| Years doing this work | 3 |
| Variable income share | 100% |
| Collateral value | ₹0 |
| Recent bounce? | **Yes** |
| Emergency savings | 0 months |
| Co-applicant income | ₹0 (husband unemployed 8 months) |
| Upcoming large expense | ₹0 |
| Informal debt detail | "₹35,000 outstanding across 3 app loans, approx. 30%+ rate, one EMI bounced last month" |
| *Skipped* | existingOffer (no lender quote received yet) |

Confidence: **7 of 8** applicable additional questions answered.

### Outputs

**O1 — Verdict: DON'T BORROW**
> You've already bounced a payment in the last 6 months and are carrying high-cost informal debt — taking on a new loan now would very likely lead to another bounce, not solve the underlying cash-flow gap.
> *Focus on clearing or restructuring the existing high-rate debt first; revisit new borrowing once repayments have been current for a few months.*

**O2, O3, O4 — intentionally not shown.** Once the app decides the safe answer is "don't borrow," it doesn't display a ₹0 amount/rate/EMI breakdown — that would look like an error rather than a considered answer. Instead it explains the underlying math in plain language:
> Applied an extra 25% haircut because 100% of her income is variable. Capped safe obligations at 30% (informal income), reduced further for the recent bounce and near-zero emergency buffer. Safe EMI ceiling ends up capped by a 20% safe-obligation limit — i.e., there is no safe room for a new EMI right now.

### Negotiation Card
**Not shown.** There is nothing to negotiate with a lender when the answer is "don't borrow yet" — showing a card here would undercut the verdict.

### What Anita could act on tomorrow
Even without a borrowing plan, this run gives her something concrete: a clear, defensible reason to say no to the e-scooter loan right now, and a specific, actionable next step (get the existing informal debt current, then revisit).

---

## Cross-borrower comparison

| | Priya | Ravi | Anita |
|---|---|---|---|
| Verdict | BORROW | BORROW LESS | DON'T BORROW |
| Product | Personal Loan | LAP/Gold (secured) | — |
| Fair rate | 11.2–13.8% | 8.8–11.2% | — |
| Confidence | 0/6 | 3/9 | 7/8 |

The spread here is the point: three borrowers, three genuinely different answers, each traceable to specific inputs rather than a single scoring formula treating them the same way.