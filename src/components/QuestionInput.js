// src/components/QuestionInput.jsx
import { useState } from "react";

// Human-readable labels for select options, so the borrower doesn't see
// raw ids like "self_employed_informal".
const OPTION_LABELS = {
  wedding: "Wedding",
  medical: "Medical",
  education: "Education",
  home_purchase: "Buying a home",
  home_improvement: "Home improvement/renovation",
  business_stock_or_equipment:
    "Business (stock/equipment/vehicle for business)",
  vehicle: "Vehicle (personal use)",
  debt_consolidation: "Paying off other debt",
  other: "Other",
  salaried: "Salaried (fixed monthly salary)",
  self_employed_formal: "Self-employed, with ITR/business registration",
  self_employed_informal: "Self-employed, mostly cash income",
  gig_informal: "Gig/platform work or daily wage",
};

export default function QuestionInput({ question, onAnswer, onSkip, canSkip }) {
  const [draft, setDraft] = useState("");

  function submitNumber() {
    const n = Number(draft);
    if (draft.trim() === "" || Number.isNaN(n)) return;
    onAnswer(n);
    setDraft("");
  }

  function submitText() {
    if (draft.trim() === "") return;
    onAnswer(draft.trim());
    setDraft("");
  }

  return (
    <div className="question-card">
      <p className="question-label">{question.label}</p>

      {question.type === "select" && (
        <div className="option-grid">
          {question.options.map((opt) => (
            <button
              key={opt}
              className="option-btn"
              onClick={() => onAnswer(opt)}
            >
              {OPTION_LABELS[opt] || opt}
            </button>
          ))}
        </div>
      )}

      {question.type === "boolean" && (
        <div className="option-grid">
          <button className="option-btn" onClick={() => onAnswer(true)}>
            Yes
          </button>
          <button className="option-btn" onClick={() => onAnswer(false)}>
            No
          </button>
        </div>
      )}

      {question.type === "number" && (
        <div className="input-row">
          <input
            type="number"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitNumber()}
            placeholder="Enter a number"
            autoFocus
          />
          <button className="primary-btn" onClick={submitNumber}>
            Next
          </button>
        </div>
      )}

      {question.type === "number_or_unknown" && (
        <div className="input-row">
          <input
            type="number"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitNumber()}
            placeholder="Enter a number"
            autoFocus
          />
          <button className="primary-btn" onClick={submitNumber}>
            Next
          </button>
          <button className="text-btn" onClick={() => onAnswer("unknown")}>
            I don't know
          </button>
        </div>
      )}

      {question.type === "text" && (
        <div className="input-row">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitText()}
            placeholder="Type here"
            autoFocus
          />
          <button className="primary-btn" onClick={submitText}>
            Next
          </button>
        </div>
      )}

      {canSkip && (
        <button className="skip-btn" onClick={onSkip}>
          Skip — I'd rather not answer this
        </button>
      )}
    </div>
  );
}
