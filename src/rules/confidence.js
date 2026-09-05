// src/rules/confidence.js
//
// Confidence is NOT a vague "high/medium/low" label pulled from nowhere.
// It's a 0-1 score = (relevant additional questions answered) / (relevant
// additional questions that applied to this borrower).
// MUST questions don't count here — they're mandatory, so answering them
// is the floor, not a confidence bonus.
//
// Rule 2 from the brief: "Never narrow a range you have no basis to narrow."
// So every consumer of this score (affordability.js, rate.js, emi.js) uses
// it to WIDEN bands as confidence drops, never to invent precision.

import { ADDITIONAL_QUESTIONS } from "./questions.js";

export function computeConfidence(answers) {
  const relevant = ADDITIONAL_QUESTIONS.filter(
    (q) => !q.appliesWhen || q.appliesWhen(answers),
  );

  if (relevant.length === 0) {
    // Nothing extra applied to this borrower at all (rare) — treat as
    // full confidence on the additional layer since there was nothing to ask.
    return { score: 1, answered: 0, total: 0, missing: [] };
  }

  const answered = relevant.filter((q) => answers[q.id] !== undefined);
  const missing = relevant.filter((q) => answers[q.id] === undefined);

  return {
    score: answered.length / relevant.length,
    answered: answered.length,
    total: relevant.length,
    missing: missing.map((q) => ({ id: q.id, moves: q.moves })),
  };
}

// Converts a confidence score into a widening multiplier.
// score 1.0 (everything answered)  -> band width x1.0 (tightest we ever go)
// score 0.0 (nothing answered)     -> band width x2.2 (must-only, widest)
// Linear in between. Tunable, documented in RULES.md as "our judgement."
export function widthMultiplier(confidenceScore) {
  const MIN_MULT = 1.0;
  const MAX_MULT = 2.2;
  return MAX_MULT - confidenceScore * (MAX_MULT - MIN_MULT);
}

// Also treats specific "unknown" answers (e.g. credit score) as their own
// confidence penalty, independent of the additional-question score, because
// an unknown credit score isn't optional the way "co-applicant income" is —
// it's a must-question that came back unresolved. Per rule 3: unknown != 0.
export function creditScoreConfidencePenalty(answers) {
  return answers.creditScore === "unknown" ? 0.15 : 0; // added to width multiplier
}

export function totalWidthMultiplier(answers) {
  const conf = computeConfidence(answers);
  return widthMultiplier(conf.score) + creditScoreConfidencePenalty(answers);
}
