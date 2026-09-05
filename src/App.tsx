// src/App.tsx
import { useAssistant } from "./hooks/useAssistant.js";
import QuestionFlow from "./components/QuestionFlow.jsx";
import { mustAnsweredCount, mustTotalCount } from "./rules/questions.js";
import "./App.css";

export default function App() {
  const {
    answers,
    phase,
    currentMustQuestion,
    additionalQueue,
    answer,
    skip,
    result,
    viewResults,
    backToQuestions,
  } = useAssistant();

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Borrower Copilot</h1>
        <p className="tagline">
          Know your numbers before you walk into a lender.
        </p>
      </header>

      <main className="app-main">
        {phase !== "results" && (
          <QuestionFlow
            phase={phase}
            currentMustQuestion={currentMustQuestion}
            additionalQueue={additionalQueue}
            answer={answer}
            skip={skip}
            viewResults={viewResults}
            mustAnsweredCount={mustAnsweredCount(answers)}
            mustTotalCount={mustTotalCount(answers)}
          />
        )}

        {phase === "results" && result && (
          <div className="flow-screen">
            <p>Results screen goes here (Step 15).</p>
            <button className="secondary-btn" onClick={backToQuestions}>
              ← Back to questions
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
