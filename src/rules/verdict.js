// src/rules/verdict.js
//
// O1: BORROW / BORROW_LESS / DONT_BORROW, with a one-sentence reason.
// "Don't borrow" must be reachable — these are the concrete triggers
// that fire it, not a vague risk score.

export function computeVerdict(answers, affordability, requestedAmount) {
  const reasons = [];
  const amount = Number(requestedAmount) || 0;
  const safeCeiling = affordability.safeBand.high;

  // --- Hard stop triggers: DONT_BORROW -------------------------------

  // 1. Active high-cost informal debt already outstanding + a recent bounce.
  //    This is Anita's exact situation in the brief.
  if (answers.recentBounce === true && Number(answers.existingEMIs) > 0) {
    const hasExpensiveInformalDebt =
      typeof answers.informalDebtDetail === "string" &&
      answers.informalDebtDetail.trim().length > 0;
    if (hasExpensiveInformalDebt) {
      return {
        verdict: "DONT_BORROW",
        reason:
          "You've already bounced a payment in the last 6 months and are carrying high-cost informal debt — taking on a new loan now would very likely lead to another bounce, not solve the underlying cash-flow gap.",
        alternative:
          "Focus on clearing or restructuring the existing high-rate debt first; revisit new borrowing once repayments have been current for a few months.",
      };
    }
  }

  // 2. Safe capacity is near zero — expenses already consume income.
  if (safeCeiling <= 0 || affordability.emiCap.safeMaxEMI <= 0) {
    return {
      verdict: "DONT_BORROW",
      reason:
        "After your existing EMIs and essential household expenses, there is no safe room left in your monthly budget for a new EMI of any size.",
      alternative:
        "Look at reducing existing obligations or increasing income before taking on new debt.",
    };
  }

  // 3. Requested amount is wildly beyond even the lender ceiling (e.g. >3x)
  //    with no productive/collateral justification — signals the ask itself
  //    is not grounded in what this borrower can access at all.
  if (
    amount > affordability.lenderBand.high * 3 &&
    !(Number(answers.collateralValue) > 0)
  ) {
    return {
      verdict: "DONT_BORROW",
      reason: `The ₹${amount.toLocaleString("en-IN")} you're asking for is far beyond what any lender is likely to sanction given your current profile — pursuing it as-is will mean high-cost, high-risk lenders.`,
      alternative:
        "Consider a smaller, phased amount, or building collateral/credit history first.",
    };
  }

  // --- BORROW_LESS: requested amount exceeds the safe ceiling but a
  // smaller amount is genuinely workable. ------------------------------
  if (amount > safeCeiling) {
    const reduction = Math.round((1 - safeCeiling / amount) * 100);
    return {
      verdict: "BORROW_LESS",
      reason: `You asked for ₹${amount.toLocaleString("en-IN")}, but your safe ceiling is closer to ₹${Math.round(safeCeiling).toLocaleString("en-IN")} — about ${reduction}% less — based on your income, expenses, and existing obligations.`,
      alternative: `Consider borrowing ₹${Math.round(safeCeiling).toLocaleString("en-IN")} now, or phase the remaining need for later.`,
    };
  }

  // --- Productive-loan upgrade note (doesn't change verdict, but shows in reason) ---
  const productiveReturn = Number(answers.loanProductivityReturn);
  let productiveNote = "";
  if (!Number.isNaN(productiveReturn) && productiveReturn > 0) {
    productiveNote = ` This is further supported by the ₹${productiveReturn.toLocaleString("en-IN")}/month in extra income you expect the loan to generate.`;
  }

  // --- Default: BORROW, within the safe ceiling ------------------------
  return {
    verdict: "BORROW",
    reason: `₹${amount.toLocaleString("en-IN")} is within your safe borrowing ceiling of about ₹${Math.round(safeCeiling).toLocaleString("en-IN")}, so this is affordable at a sensible EMI.${productiveNote}`,
    alternative: null,
  };
}
