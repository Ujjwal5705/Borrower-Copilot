// src/components/QuestionFlow.jsx
import QuestionInput from "./QuestionInput.jsx";

export default function QuestionFlow({
  phase,
  currentMustQuestion,
  additionalQueue,
  answer,
  skip,
  viewResults,
  mustAnsweredCount,
  mustTotalCount,
}) {
  if (phase === "must") {
    return (
      <div className="flow-screen">
        <div className="progress-label">
          Question {mustAnsweredCount + 1} of about {mustTotalCount}
        </div>
        <QuestionInput
          question={currentMustQuestion}
          onAnswer={(val) => answer(currentMustQuestion.id, val)}
          canSkip={false}
        />
        <p className="hint-text">
          These are the minimum questions we need. You can't skip these, but
          there are only a handful left.
        </p>
      </div>
    );
  }

  // phase === "additional"
  if (additionalQueue.length === 0) {
    return (
      <div className="flow-screen">
        <p className="all-done-text">
          That's everything we'd ask — you've given us the full picture.
        </p>
        <button className="primary-btn" onClick={viewResults}>
          See my results
        </button>
      </div>
    );
  }

  const current = additionalQueue[0];
  return (
    <div className="flow-screen">
      <div className="progress-label">
        A few more questions can sharpen your numbers — answer as many or as few
        as you like.
      </div>
      <QuestionInput
        question={current}
        onAnswer={(val) => answer(current.id, val)}
        onSkip={() => skip(current.id)}
        canSkip={true}
      />
      <p className="hint-text">This question affects: {current.moves}</p>
      <button className="secondary-btn" onClick={viewResults}>
        Skip the rest — show me my results now
      </button>
    </div>
  );
}
