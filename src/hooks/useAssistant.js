// src/hooks/useAssistant.js
import { useState, useMemo } from "react";
import {
  nextMustQuestion,
  pendingAdditionalQuestions,
  isMustSetComplete,
} from "../rules/questions.js";
import { runEngine } from "../rules/engine.js";

export function useAssistant() {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const mustDone = isMustSetComplete(answers);
  const currentMustQuestion = nextMustQuestion(answers);
  const additionalQueue = useMemo(
    () => pendingAdditionalQuestions(answers),
    [answers],
  );

  // Phase drives what the UI shows:
  // "must"       -> still collecting must-questions
  // "additional" -> must-set done, offering additional questions one at a time
  // "results"    -> user asked to see results (always allowed once must-set is done)
  const phase = !mustDone ? "must" : showResults ? "results" : "additional";

  function answer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function skip(id) {
    // Explicit skip still needs to mark the question as "handled" so it
    // doesn't loop forever, but must NOT count as answered for confidence.
    // We store a sentinel the confidence/rules code treats as undefined
    // for narrowing purposes but removes it from the pending queue.
    setAnswers((prev) => ({
      ...prev,
      [id]: undefined,
      [`__skipped_${id}`]: true,
    }));
  }

  const result = mustDone ? runEngine(stripSkipMarkers(answers)) : null;

  return {
    answers,
    phase,
    currentMustQuestion,
    additionalQueue,
    answer,
    skip,
    result,
    viewResults: () => setShowResults(true),
    backToQuestions: () => setShowResults(false),
  };
}

function stripSkipMarkers(answers) {
  const clean = {};
  for (const k of Object.keys(answers)) {
    if (!k.startsWith("__skipped_")) clean[k] = answers[k];
  }
  return clean;
}
