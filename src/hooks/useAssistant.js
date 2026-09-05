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
  const [skipped, setSkipped] = useState(() => new Set());
  const [showResults, setShowResults] = useState(false);

  const mustDone = isMustSetComplete(answers);
  const currentMustQuestion = nextMustQuestion(answers);

  // Additional questions: relevant, unanswered, AND not explicitly skipped.
  const additionalQueue = useMemo(
    () => pendingAdditionalQuestions(answers).filter((q) => !skipped.has(q.id)),
    [answers, skipped],
  );

  // "must"       -> still collecting must-questions (mandatory, can't skip)
  // "additional" -> must-set done, offering additional questions one at a time
  // "results"    -> user asked to see results (always allowed once must-set is done)
  const phase = !mustDone ? "must" : showResults ? "results" : "additional";

  function answer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function skip(id) {
    setSkipped((prev) => new Set(prev).add(id));
  }

  const result = mustDone ? runEngine(answers) : null;

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
