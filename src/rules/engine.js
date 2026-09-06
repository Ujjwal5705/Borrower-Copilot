// src/rules/engine.js
//
// Single entry point for the UI. Given the answers collected so far,
// returns everything needed to render results + Negotiation Card.
// Order matters: product routing must happen before affordability
// (FOIR caps depend on product), rate depends on product + affordability
// context, EMI output depends on rate + safe amount, verdict depends on
// affordability + requested amount.

import {
  isMustSetComplete,
  nextMustQuestion,
  pendingAdditionalQuestions,
} from "./questions.js";
import {
  routeProduct,
  computeMaxAmount,
  maxEMICapacity,
  principalFromEMI,
} from "./affordability.js";
import { computeRateBand, computeAPR, getProcessingFeePct } from "./rate.js";
import { computeEMIOutput, emiFromPrincipal } from "./emi.js";
import { computeVerdict } from "./verdict.js";
import { computeConfidence } from "./confidence.js";

export function runEngine(answers) {
  if (!isMustSetComplete(answers)) {
    return {
      ready: false,
      nextQuestion: nextMustQuestion(answers),
      pendingAdditional: pendingAdditionalQuestions(answers),
    };
  }

  // 1. Product routing — everything else depends on this.
  let product = routeProduct(answers);

  // Age-based tenure cap: standard lending practice is that the loan must
  // be repaid by around retirement age (~60). Without this, `age` was
  // collected but never actually used by any rule.
  const age = Number(answers.age);
  if (!Number.isNaN(age) && age > 0) {
    const maxTenureByAge = Math.max(60 - age, 1);
    if (maxTenureByAge < product.defaultTenureYears) {
      product = {
        ...product,
        defaultTenureYears: maxTenureByAge,
        why: `${product.why} Tenure capped to ${maxTenureByAge} years so the loan is repaid by around age 60.`,
      };
    }
  }

  const rateBand = computeRateBand(answers, product);
  const assumedRate = rateBand.center;

  // 3. Affordability — O2. Uses the assumed rate from step 2.
  const amountOutput = computeMaxAmount(answers, product, assumedRate);

  // 4. Decide the amount to actually use for EMI/APR presentation:
  //    the smaller of (requested amount, recommended ceiling), so the
  //    Negotiation Card is always grounded in something achievable.
  const requestedAmount = Number(answers.amountWanted) || 0;
  const recommendedBand =
    amountOutput.recommendedUse === "safe"
      ? amountOutput.safeBand
      : amountOutput.lenderBand;
  const amountToUse = Math.min(requestedAmount, recommendedBand.high);

  // 5. EMI output — O4. Uses safe EMI ceiling from affordability + rate.
  const emiOutput = computeEMIOutput(
    answers,
    product,
    amountOutput.emiCap.safeMaxEMI,
    amountToUse,
    assumedRate,
  );

  // 6. APR — folds in processing fee for the amount/tenure actually shown.
  const processingFeePct = getProcessingFeePct(product);
  const apr = computeAPR(
    assumedRate,
    processingFeePct,
    amountToUse,
    emiOutput.chosenTenureYears,
    emiFromPrincipal,
  );

  // 7. Stress case — required by the brief, attached to O4.
  const stress = stressCaseFor(answers, amountOutput, emiOutput, assumedRate);

  // 8. Verdict — O1. Uses affordability + requested amount, computed last
  //    so it can react to everything above.
  const verdict = computeVerdict(answers, amountOutput, requestedAmount);

  // 9. Confidence summary for display ("this is a wide range because...").
  const confidence = computeConfidence(answers);

  return {
    ready: true,
    answers,
    product,
    verdict,
    amountOutput,
    rateBand,
    apr,
    emiOutput,
    stress,
    confidence,
    amountToUse,
    requestedAmount,
  };
}

// Kept local to the engine (not emi.js) since it needs amountOutput's
// safeIncomeUsed, which only exists after affordability has run.
function stressCaseFor(answers, amountOutput, emiOutput, ratePct) {
  const INCOME_DROP_PCT = 20;
  const RATE_RISE_PP = 1.5;
  const safeIncome = amountOutput.emiCap.safeIncomeUsed;
  const chosenEMI =
    emiOutput.tradeoff.find((t) => t.years === emiOutput.chosenTenureYears)
      ?.emi ?? emiOutput.emiCeiling;

  const droppedIncome = safeIncome * (1 - INCOME_DROP_PCT / 100);
  const foirUnderDrop =
    droppedIncome > 0 ? chosenEMI / droppedIncome : Infinity;

  return {
    incomeDropPct: INCOME_DROP_PCT,
    resultingIncome: droppedIncome,
    emiShareUnderDrop: foirUnderDrop,
    unsafeUnderDrop: foirUnderDrop > 0.5,
    rateRisePP: RATE_RISE_PP,
    ratePctIfRoseNow: ratePct + RATE_RISE_PP,
    why: `Stress-tested against a ${INCOME_DROP_PCT}% income drop and a ${RATE_RISE_PP} percentage-point rate rise. ${foirUnderDrop > 0.5 ? "Under the income-drop scenario, this EMI would exceed a safe share of income — worth planning a buffer for." : "This EMI would still be manageable under the income-drop scenario."}`,
  };
}
