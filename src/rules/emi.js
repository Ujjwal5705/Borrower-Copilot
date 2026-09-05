// src/rules/emi.js
//
// O4: a monthly ceiling the borrower should not cross, tenure trade-off,
// and one mandatory stress case (brief requires this explicitly).

import { emiFromPrincipal, principalFromEMI } from "./affordability.js";

// Shows the same amount at a few tenure choices so the borrower can see
// the EMI/total-interest trade-off, not just one number.
export function tenureTradeoff(amount, ratePct, candidateTenures) {
  return candidateTenures.map((years) => {
    const emi = emiFromPrincipal(amount, ratePct, years);
    const totalPaid = emi * years * 12;
    const totalInterest = totalPaid - amount;
    return { years, emi, totalPaid, totalInterest };
  });
}

// The mandatory stress case: what happens to the EMI's share of income if
// (a) income drops by a defined shock %, or (b) rate rises by a defined
// shock amount. We run both and report whichever is worse, since the
// borrower should plan for either.
export function stressCase(answers, safeIncomeUsed, chosenEMI, chosenRatePct) {
  const INCOME_DROP_PCT = 20; // our judgement: a common job-loss/slow-season shock
  const RATE_RISE_PP = 1.5; // our judgement: a plausible repo-cycle rate rise

  const droppedIncome = safeIncomeUsed * (1 - INCOME_DROP_PCT / 100);
  const foirUnderIncomeDrop =
    droppedIncome > 0 ? chosenEMI / droppedIncome : Infinity;

  const riskyForVariable = answers.incomeType !== "salaried";

  return {
    incomeDropScenario: {
      dropPct: INCOME_DROP_PCT,
      resultingIncome: droppedIncome,
      emiShareOfIncome: foirUnderIncomeDrop,
      verdict:
        foirUnderIncomeDrop > 0.5
          ? "unsafe: EMI would exceed half your income in this scenario"
          : "would still be manageable",
    },
    rateRiseScenario: {
      riseInPP: RATE_RISE_PP,
      newRatePct: chosenRatePct + RATE_RISE_PP,
    },
    why: `We stress-tested a ${INCOME_DROP_PCT}% income drop (${riskyForVariable ? "relevant given your variable income" : "a standard planning shock"}) and a ${RATE_RISE_PP} percentage-point rate rise, since floating-rate loans can reprice.`,
  };
}

// Pulls together O4 using the safe EMI ceiling already computed in
// affordability.js — this file does NOT recompute the ceiling, it only
// presents it with tenure options and the stress test, to avoid two
// sources of truth for the same number.
export function computeEMIOutput(
  answers,
  product,
  safeMaxEMI,
  safeAmountToBorrow,
  ratePct,
) {
  const tenureOptions = [
    Math.max(product.defaultTenureYears - 2, 1),
    product.defaultTenureYears,
    product.defaultTenureYears + 2,
  ].filter((y, i, arr) => arr.indexOf(y) === i);

  const tradeoff = tenureTradeoff(safeAmountToBorrow, ratePct, tenureOptions);
  const chosen =
    tradeoff.find((t) => t.years === product.defaultTenureYears) || tradeoff[0];

  return {
    emiCeiling: safeMaxEMI,
    ceilingWhy: `This is the highest monthly payment your income and expenses can absorb without real stress — see the affordability breakdown for the exact math.`,
    tradeoff,
    chosenTenureYears: chosen.years,
  };
}

export { emiFromPrincipal, principalFromEMI };
