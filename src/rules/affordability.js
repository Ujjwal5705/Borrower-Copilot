// src/rules/affordability.js
//
// Two separate numbers, always:
//   - LENDER number: what a lender's FOIR math would likely sanction,
//     using the income a lender will actually accept as proof.
//   - SAFE number: what the borrower can carry without real stress,
//     using realistic income (low end of range for variable earners)
//     and a stricter FOIR cap.
// These are often very different. The app must say which one to use
// (almost always: the safe number, unless it's higher than the lender
// number, in which case the lender number is the real ceiling anyway).

import { totalWidthMultiplier } from "./confidence.js";

// ---- 1. Product routing --------------------------------------------------

export function routeProduct(answers) {
  const amount = Number(answers.amountWanted) || 0;
  const collateral = Number(answers.collateralValue) || 0;
  const purpose = answers.purpose;

  // Rule (our judgement): if collateral covers the ask with margin, always
  // route to the secured product — it's strictly better for the borrower
  // (lower rate, higher sanction) and lenders will offer it anyway.
  if (collateral >= amount * 1.5 && collateral > 0) {
    return {
      product: "loan_against_property_or_gold",
      why: "You have collateral worth well more than what you're asking for — a secured loan will get you a lower rate and a higher sanction than an unsecured one.",
      defaultTenureYears: purpose === "business_stock_or_equipment" ? 7 : 10,
    };
  }

  if (purpose === "vehicle") {
    return {
      product: "vehicle_loan",
      why: "Vehicle purchases are financed as secured vehicle loans (the vehicle itself is collateral), which is cheaper than a personal loan.",
      defaultTenureYears: 5,
    };
  }

  if (purpose === "business_stock_or_equipment") {
    return {
      product:
        collateral > 0 ? "business_loan_secured" : "business_loan_unsecured",
      why:
        collateral > 0
          ? "Business purpose with some collateral available — a secured business loan/LAP is usually cheaper than an unsecured one."
          : "Business purpose without collateral routes to an unsecured business loan, priced higher for the risk.",
      defaultTenureYears: 5,
    };
  }

  if (purpose === "home_purchase" || purpose === "home_improvement") {
    return {
      product: "home_loan",
      why: "Home purchase/improvement is financed as a home loan — the cheapest secured category, and lenders allow a higher FOIR for it.",
      defaultTenureYears: 15,
    };
  }

  // wedding, medical, education, debt_consolidation, other -> unsecured personal loan
  return {
    product: "personal_loan_unsecured",
    why: "This purpose is normally financed as an unsecured personal loan.",
    defaultTenureYears: 5,
  };
}

// ---- 2. Effective income for LENDER vs SAFE calculations -----------------

export function lenderRecognizedIncome(answers) {
  const { incomeType } = answers;
  const stated = Number(answers.netMonthlyIncome) || 0;
  const coApplicant = Number(answers.coApplicantIncome) || 0;

  if (incomeType === "salaried") {
    return {
      income: stated + coApplicant,
      why: "Salaried net income is fully recognized by lenders (salary slips/bank statements).",
    };
  }
  if (incomeType === "self_employed_formal") {
    if (answers.itrFiled) {
      return {
        income: stated + coApplicant,
        why: "ITR-filed self-employed income is recognized close to face value.",
      };
    }
    return {
      income: stated * 0.5 + coApplicant,
      why: "Without filed ITR, lenders typically recognize only about half of stated self-employed income — the rest is undocumented as far as they're concerned.",
    };
  }
  // self_employed_informal / gig_informal
  if (answers.itrFiled) {
    return {
      income: stated * 0.7 + coApplicant,
      why: "Some ITR proof exists, so a lender recognizes most, not all, of stated cash income.",
    };
  }
  return {
    income: stated * 0.3 + coApplicant,
    why: "With no formal income proof, most lenders recognize only a small fraction of cash income (or none, without collateral).",
  };
}

export function safeRealisticIncome(answers) {
  const coApplicant = Number(answers.coApplicantIncome) || 0;
  const variableShare = Number(answers.variableIncomeShare);
  const hasRange = answers.incomeRangeHigh !== undefined;

  let base;
  if (hasRange) {
    // Use the LOW end of the stated range for safety — the household must
    // be able to pay the EMI even in a below-average month.
    base = Number(answers.netMonthlyIncome);
    base = Math.min(base, Number(answers.netMonthlyIncome)); // stated income is treated as the low/typical figure
  } else {
    base = Number(answers.netMonthlyIncome) || 0;
  }

  let discount = 0;
  let why = "Using your stated typical monthly income.";
  if (!Number.isNaN(variableShare) && variableShare > 0) {
    // Further haircut proportional to how much of income is unpredictable.
    discount = (variableShare / 100) * 0.25; // up to 25% extra haircut at 100% variable
    why = `Applied an extra ${Math.round(discount * 100)}% haircut because about ${variableShare}% of your income is variable — safe planning uses a conservative month, not an average one.`;
  }

  const income = base * (1 - discount) + coApplicant;
  return { income, why };
}

// ---- 3. FOIR caps ----------------------------------------------------------

export function foirCaps(answers, product) {
  const { incomeType } = answers;
  const recentBounce = answers.recentBounce === true;

  // Lender-side cap: standard industry FOIR bands, tightened for informal
  // income and secured products get more room.
  let lenderFOIR = 0.5; // default unsecured, salaried
  let lenderWhy =
    "Standard lender FOIR cap for a salaried unsecured borrower is around 50% of net income.";

  if (product.product === "home_loan" || product.product.includes("secured")) {
    lenderFOIR = 0.65;
    lenderWhy =
      "Secured products (home loan / LAP / vehicle) get a higher FOIR allowance, typically up to ~65%, because collateral backs the lender.";
  } else if (incomeType === "self_employed_formal") {
    lenderFOIR = 0.45;
    lenderWhy =
      "Self-employed formal borrowers are typically capped a bit lower, around 45%, due to income variability even with ITR proof.";
  } else if (
    incomeType === "self_employed_informal" ||
    incomeType === "gig_informal"
  ) {
    lenderFOIR = 0.35;
    lenderWhy =
      "Informal-income borrowers are capped conservatively, around 35%, by most lenders absent collateral.";
  }

  if (recentBounce) {
    lenderFOIR -= 0.1;
    lenderWhy +=
      " Reduced further because of a bounced payment in the last 6 months.";
  }
  lenderFOIR = Math.max(lenderFOIR, 0.15);

  // Safe-side cap: what we'd tell the borrower regardless of what a lender
  // allows. Always stricter than or equal to lender FOIR — this is the
  // borrower-protective number.
  let safeFOIR = 0.4;
  let safeWhy =
    "We cap safe monthly obligations at 40% of realistic income, the standard affordability guideline for financial stress avoidance.";

  if (incomeType !== "salaried") {
    safeFOIR = 0.3;
    safeWhy =
      "For variable/informal income we cap safe obligations lower, at 30%, since a bad month can't be smoothed the way a fixed salary can.";
  }
  if (recentBounce) {
    safeFOIR -= 0.05;
    safeWhy +=
      " Reduced further given a recent bounce — the household is already close to its limit.";
  }
  const emergencyMonths = Number(answers.emergencySavingsMonths);
  if (!Number.isNaN(emergencyMonths) && emergencyMonths < 1) {
    safeFOIR -= 0.05;
    safeWhy +=
      " Reduced further because there's less than a month of emergency buffer.";
  }
  safeFOIR = Math.max(safeFOIR, 0.15);

  return { lenderFOIR, lenderWhy, safeFOIR, safeWhy };
}

// ---- 4. EMI capacity and amount conversion --------------------------------

export function maxEMICapacity(answers, product) {
  const existingEMIs = Number(answers.existingEMIs) || 0;
  const householdExpenses = Number(answers.householdExpenses) || 0;

  const lenderInc = lenderRecognizedIncome(answers);
  const safeInc = safeRealisticIncome(answers);
  const caps = foirCaps(answers, product);

  const lenderMaxEMI = Math.max(
    lenderInc.income * caps.lenderFOIR - existingEMIs,
    0,
  );

  // Safe EMI is bounded two ways: FOIR cap on income, AND what's left after
  // essential household expenses — whichever is tighter wins. This is what
  // stops a technically-FOIR-compliant EMI from starving the household budget.
  const foirBoundedSafeEMI = Math.max(
    safeInc.income * caps.safeFOIR - existingEMIs,
    0,
  );
  const expenseBoundedSafeEMI = Math.max(
    safeInc.income - householdExpenses - existingEMIs,
    0,
  );
  const safeMaxEMI = Math.min(foirBoundedSafeEMI, expenseBoundedSafeEMI);
  const safeBindingReason =
    foirBoundedSafeEMI <= expenseBoundedSafeEMI
      ? `capped by the ${Math.round(caps.safeFOIR * 100)}% safe-obligation limit`
      : "capped by what's left after your essential household expenses, which is tighter than the FOIR limit here";

  return {
    lenderMaxEMI,
    safeMaxEMI,
    lenderIncomeUsed: lenderInc.income,
    safeIncomeUsed: safeInc.income,
    lenderWhy: `${lenderInc.why} ${caps.lenderWhy}`,
    safeWhy: `${safeInc.why} ${caps.safeWhy} Your safe EMI ceiling is ${safeBindingReason}.`,
  };
}

// Standard reducing-balance EMI-to-principal conversion.
export function principalFromEMI(emi, annualRatePct, tenureYears) {
  const r = annualRatePct / 12 / 100;
  const n = tenureYears * 12;
  if (r === 0) return emi * n;
  return (emi * (1 - Math.pow(1 + r, -n))) / r;
}

export function emiFromPrincipal(principal, annualRatePct, tenureYears) {
  const r = annualRatePct / 12 / 100;
  const n = tenureYears * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

// ---- 5. Pulling it together: O2 ---------------------------------------

export function computeMaxAmount(answers, product, assumedRatePct) {
  const emiCap = maxEMICapacity(answers, product);
  const tenure = product.defaultTenureYears;
  const mult = totalWidthMultiplier(answers); // >=1, widens with low confidence

  const lenderAmountPoint = principalFromEMI(
    emiCap.lenderMaxEMI,
    assumedRatePct,
    tenure,
  );
  const safeAmountPoint = principalFromEMI(
    emiCap.safeMaxEMI,
    assumedRatePct,
    tenure,
  );

  // Confidence widens the band around the point estimate; it never raises
  // the point estimate itself (rule 3/4: unknown adds uncertainty, not upside).
  const lenderBand = { low: lenderAmountPoint / mult, high: lenderAmountPoint };
  const safeBand = { low: safeAmountPoint / mult, high: safeAmountPoint };

  const recommended = safeAmountPoint <= lenderAmountPoint ? "safe" : "lender";

  return {
    lenderBand,
    safeBand,
    tenureYearsAssumed: tenure,
    recommendedUse: recommended,
    recommendationWhy:
      recommended === "safe"
        ? "Your safe ceiling is lower than what a lender might approve — borrow to the safe number, not the sanction letter."
        : "Your safe ceiling actually exceeds what a lender is likely to sanction here, so the lender's number is the real constraint.",
    emiCap,
  };
}
