// src/rules/questions.js
//
// MUST questions: minimum set to produce all four outputs.
// If only these are answered, the app still works — with wide bands.
//
// ADDITIONAL questions: each one exists ONLY because it narrows a
// specific output. The comment next to each says which output it moves
// and why. If you can't point to a moved number, don't add the question.

export const MUST_QUESTIONS = [
  {
    id: "purpose",
    label: "What is this loan for?",
    type: "select",
    options: [
      "wedding",
      "medical",
      "education",
      "home_purchase",
      "home_improvement",
      "business_stock_or_equipment",
      "vehicle",
      "debt_consolidation",
      "other",
    ],
  },

  {
    id: "amountWanted",
    label: "How much do you want to borrow? (₹)",
    type: "number",
  },

  {
    id: "incomeType",
    label: "How would you describe your income?",
    type: "select",
    options: [
      "salaried",
      "self_employed_formal",
      "self_employed_informal",
      "gig_informal",
    ],
  },
  // formal = files ITR / has business registration. informal = cash-heavy, no ITR.

  {
    id: "netMonthlyIncome",
    label: "What is your typical net monthly income? (₹)",
    type: "number",
  },

  {
    id: "incomeRangeHigh",
    label: "On a good month, what's the most you take home? (₹)",
    type: "number",
    appliesWhen: (a) =>
      a.incomeType === "self_employed_informal" ||
      a.incomeType === "gig_informal",
  },
  // For irregular income we need a range, not a point, to even define "net income."

  {
    id: "existingEMIs",
    label: "Total of all existing loan EMIs per month (₹, 0 if none)",
    type: "number",
  },

  {
    id: "householdExpenses",
    label:
      "Essential monthly household expenses (rent, food, school, utilities) (₹)",
    type: "number",
  },

  { id: "age", label: "Your age", type: "number" },

  {
    id: "creditScore",
    label: "Your credit score, if you know it (or 'unknown')",
    type: "number_or_unknown",
  },

  {
    id: "tenureYears",
    label: "How long have you had this job / run this business? (years)",
    type: "number",
  },
];

export const ADDITIONAL_QUESTIONS = [
  {
    id: "variableIncomeShare",
    label:
      "Roughly what % of your income varies month to month (not guaranteed)?",
    type: "number", // 0-100
    appliesWhen: (a) => a.incomeType !== "salaried",
    moves: "O2 (safe amount), O4 (EMI ceiling)",
    why: "High variability means we must size EMI to the LOW month, not the average.",
  },
  {
    id: "itrFiled",
    label: "Do you file ITR / have audited business income proof?",
    type: "boolean",
    appliesWhen: (a) =>
      a.incomeType === "self_employed_formal" ||
      a.incomeType === "self_employed_informal",
    moves: "O2 (lender-sanction number), O3 (rate band)",
    why: "Lenders sanction against declared income, not cash income. No ITR caps the lender number hard, regardless of real cash flow.",
  },
  {
    id: "collateralValue",
    label:
      "Do you own property/gold/other asset you could pledge? If yes, approx value (₹, 0 if none)",
    type: "number",
    appliesWhen: (a) =>
      a.incomeType !== "salaried" || Number(a.amountWanted) > 500000,
    moves:
      "O2 (lender number), O3 (rate band), O1 (verdict — routes to secured product)",
    why: "Collateral moves the product from unsecured personal loan to LAP/gold loan: bigger sanction, much lower rate.",
  },
  {
    id: "cardUtilization",
    label:
      "If you have credit cards, what % of your limit do you usually carry?",
    type: "number",
    appliesWhen: (a) => a.creditScore !== "unknown",
    moves: "O3 (rate band)",
    why: "High utilization at a given score signals stress the score alone hasn't caught up to yet.",
  },
  {
    id: "recentBounce",
    label: "Have you missed or bounced an EMI/payment in the last 6 months?",
    type: "boolean",
    moves: "O1 (verdict), O2 (safe amount), O3 (rate band)",
    why: "A recent bounce is the strongest signal of current repayment stress — outweighs a stale credit score.",
  },
  {
    id: "emergencySavingsMonths",
    label:
      "If your income stopped today, how many months of expenses could you cover from savings?",
    type: "number",
    moves: "O4 (stress-case EMI), O1 (verdict)",
    why: "Buffer determines whether the household can survive the stress scenario without a second bounce.",
  },
  {
    id: "coApplicantIncome",
    label:
      "Is there a co-applicant? If yes, their net monthly income (₹, 0 if none)",
    type: "number",
    appliesWhen: (a) =>
      a.incomeType !== "salaried" ||
      Number(a.netMonthlyIncome) < Number(a.amountWanted) / 10,
    moves: "O2 (both lender and safe number)",
    why: "Combined household income is what most lenders and any sane affordability check should use.",
  },
  {
    id: "upcomingLargeExpense",
    label: "Any large expense coming in the next 12 months (₹, 0 if none)?",
    type: "number",
    moves: "O4 (EMI ceiling)",
    why: "A known future outflow eats into the same monthly budget the EMI ceiling is drawn from.",
  },
  {
    id: "loanProductivityReturn",
    label:
      "If this loan is for business, what extra monthly income do you expect it to generate?",
    type: "number",
    appliesWhen: (a) => a.purpose === "business_stock_or_equipment",
    moves: "O1 (verdict), O2 (safe amount)",
    why: "A productive loan can justify a higher safe EMI than pure consumption debt, if the return is credible.",
  },
  {
    id: "existingOffer",
    label: "Has a lender already quoted you a rate? If yes, what rate (%)?",
    type: "number",
    moves: "Negotiation Card only",
    why: "This is what the card argues against directly — no output number changes, but the card needs it.",
  },
  {
    id: "informalDebtDetail",
    label:
      "Do you have any loans from apps/moneylenders? If yes, total outstanding (₹) and approx rate (%)?",
    type: "text",
    appliesWhen: (a) =>
      Number(a.existingEMIs) > 0 &&
      (a.incomeType === "gig_informal" ||
        a.incomeType === "self_employed_informal"),
    moves:
      "O1 (verdict — can force 'borrow less' or 'don't borrow'), O4 (EMI ceiling)",
    why: "High-rate informal debt already eating income is the single biggest reason a new loan may be unsafe.",
  },
];

// Returns must-questions still unanswered, in order.
export function nextMustQuestion(answers) {
  return (
    MUST_QUESTIONS.find(
      (q) =>
        (!q.appliesWhen || q.appliesWhen(answers)) &&
        answers[q.id] === undefined,
    ) || null
  );
}

// Returns additional questions that (a) are relevant to this borrower and
// (b) haven't been answered yet. Recomputed after every answer, since
// relevance can depend on answers given later in the must-set.
export function pendingAdditionalQuestions(answers) {
  return ADDITIONAL_QUESTIONS.filter(
    (q) =>
      (!q.appliesWhen || q.appliesWhen(answers)) && answers[q.id] === undefined,
  );
}

export function isMustSetComplete(answers) {
  return nextMustQuestion(answers) === null;
}

// --- Progress helpers, used only for the "Question X of Y" UI label ---

export function mustAnsweredCount(answers) {
  return MUST_QUESTIONS.filter(
    (q) =>
      (!q.appliesWhen || q.appliesWhen(answers)) && answers[q.id] !== undefined,
  ).length;
}

export function mustTotalCount(answers) {
  // Recomputed against current answers because some must-questions have
  // appliesWhen (e.g. incomeRangeHigh only applies to variable-income
  // borrowers) — so "total" can differ per borrower, which is intentional.
  return MUST_QUESTIONS.filter((q) => !q.appliesWhen || q.appliesWhen(answers))
    .length;
}
