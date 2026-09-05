// src/App.tsx
import { useAssistant } from "./hooks/useAssistant.js";
import QuestionFlow from "./components/QuestionFlow.jsx";
import { mustAnsweredCount, mustTotalCount } from "./rules/questions.js";
import ResultsScreen from "./components/ResultsScreen.jsx";
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

        {phase === "results" && result && result.ready && (
          <ResultsScreen result={result} onBack={backToQuestions} />
        )}
      </main>
    </div>
  );
}
