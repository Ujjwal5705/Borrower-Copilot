// src/rules/rate.js
//
// O3: a BAND, not a point. We compute a center rate from base + risk
// adjustments, then widen it by the same confidence multiplier used
// elsewhere — same logic as affordability: less info -> wider band,
// never a tighter one.

import { totalWidthMultiplier } from "./confidence.js";

// Base rate bands by product, roughly reflecting real Indian market bands
// as of early 2026. Documented in RULES.md as "market knowledge, approximate."
const BASE_RATE_BY_PRODUCT = {
  home_loan: 8.5,
  loan_against_property_or_gold: 10.5,
  vehicle_loan: 9.5,
  business_loan_secured: 11.5,
  business_loan_unsecured: 15.5,
  personal_loan_unsecured: 13.5,
};

// Typical processing fee (% of principal) by product — used for APR, not
// for the headline rate.
const PROCESSING_FEE_PCT_BY_PRODUCT = {
  home_loan: 0.5,
  loan_against_property_or_gold: 1.0,
  vehicle_loan: 1.0,
  business_loan_secured: 1.5,
  business_loan_unsecured: 2.5,
  personal_loan_unsecured: 2.0,
};

export function computeRateBand(answers, product) {
  let center = BASE_RATE_BY_PRODUCT[product.product] ?? 14;
  const adjustments = [];

  // Credit score adjustment. Unknown score is NOT treated as bad (rule 3) —
  // it's treated as its own uncertainty, added via width, not via center.
  if (
    answers.creditScore !== "unknown" &&
    !Number.isNaN(Number(answers.creditScore))
  ) {
    const score = Number(answers.creditScore);
    if (score >= 750) {
      center -= 1.0;
      adjustments.push({
        delta: -1.0,
        why: `Credit score ${score} (750+) is a strong-profile discount.`,
      });
    } else if (score >= 700) {
      adjustments.push({
        delta: 0,
        why: `Credit score ${score} is in the standard band — no adjustment.`,
      });
    } else if (score >= 650) {
      center += 1.0;
      adjustments.push({
        delta: +1.0,
        why: `Credit score ${score} (650-699) adds some risk premium.`,
      });
    } else {
      center += 2.5;
      adjustments.push({
        delta: +2.5,
        why: `Credit score ${score} (below 650) adds a larger risk premium.`,
      });
    }
  } else {
    adjustments.push({
      delta: 0,
      why: "Credit score unknown — no center-rate adjustment made, but this widens the band below.",
    });
  }

  // No formal credit history at all (e.g. Ravi): treated as unknown, not
  // penalized on center, but flagged for the band width via confidence.
  if (answers.incomeType !== "salaried" && answers.creditScore === "unknown") {
    adjustments.push({
      delta: 0,
      why: "No formal credit history — common for first-time formal borrowers; doesn't move the center rate, but keeps the band wide.",
    });
  }

  // Utilization
  const util = Number(answers.cardUtilization);
  if (!Number.isNaN(util) && util > 70) {
    center += 0.75;
    adjustments.push({
      delta: +0.75,
      why: `Credit card utilization of ${util}% suggests some existing stress.`,
    });
  }

  // Recent bounce is a hard risk signal, weighted more than score.
  if (answers.recentBounce === true) {
    center += 2.0;
    adjustments.push({
      delta: +2.0,
      why: "A bounced payment in the last 6 months is a strong recent-risk signal, weighted above a stale credit score.",
    });
  }

  // Collateral coverage improves pricing further within secured products.
  const collateral = Number(answers.collateralValue) || 0;
  const amount = Number(answers.amountWanted) || 0;
  if (collateral > 0 && amount > 0 && collateral / amount >= 2) {
    center -= 0.5;
    adjustments.push({
      delta: -0.5,
      why: "Collateral value at 2x+ the loan amount typically earns a further pricing discount.",
    });
  }

  const mult = totalWidthMultiplier(answers);
  // Base half-width of 1.0 percentage point, widened by the same multiplier
  // used for amount bands — kept modest since rate bands are naturally
  // narrower than amount bands in absolute terms.
  const halfWidth = 1.0 * mult * 0.6;

  return {
    center: Math.max(center, 6), // floor, sanity guard
    low: Math.max(center - halfWidth, 6),
    high: center + halfWidth,
    adjustments,
    baseRate: BASE_RATE_BY_PRODUCT[product.product] ?? 14,
  };
}

// All-in APR: folds the processing fee into an effective annualized cost,
// using the loan's own EMI/tenure, per RBI-style all-in-cost disclosure
// intent (this is our own approximation, not an RBI-published formula).
export function computeAPR(
  nominalRatePct,
  processingFeePct,
  principal,
  tenureYears,
  emiFn,
) {
  const feeAmount = principal * (processingFeePct / 100);
  const netDisbursed = principal - feeAmount;
  const emi = emiFn(principal, nominalRatePct, tenureYears);

  // Solve effective annual rate such that the EMI stream, discounted at
  // that rate, equals netDisbursed. We approximate by bisection since
  // there's no closed form worth the complexity here.
  const n = tenureYears * 12;
  function pvAtMonthlyRate(rMonthly) {
    if (rMonthly === 0) return emi * n;
    return (emi * (1 - Math.pow(1 + rMonthly, -n))) / rMonthly;
  }
  let lo = 0,
    hi = 1; // monthly rate search range 0% to 100% (generous)
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (pvAtMonthlyRate(mid) > netDisbursed) lo = mid;
    else hi = mid;
  }
  const effectiveMonthly = (lo + hi) / 2;
  const effectiveAnnualPct = effectiveMonthly * 12 * 100;

  return {
    nominalRatePct,
    processingFeePct,
    feeAmount,
    netDisbursed,
    emi,
    aprPct: effectiveAnnualPct,
    why: `Nominal rate ${nominalRatePct.toFixed(1)}% plus a ${processingFeePct}% processing fee (₹${Math.round(feeAmount).toLocaleString("en-IN")}) works out to an effective all-in cost of ${effectiveAnnualPct.toFixed(1)}% APR.`,
  };
}

export function getProcessingFeePct(product) {
  return PROCESSING_FEE_PCT_BY_PRODUCT[product.product] ?? 2.0;
}
