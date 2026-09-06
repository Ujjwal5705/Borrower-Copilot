// src/components/ResultsScreen.jsx
import NegotiationCard from "./NegotiationCard.jsx";

const VERDICT_COPY = {
  BORROW: { label: "You can borrow this", tone: "good" },
  BORROW_LESS: { label: "Borrow less than you asked", tone: "warn" },
  DONT_BORROW: { label: "Don't borrow right now", tone: "bad" },
};

function inr(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export default function ResultsScreen({ result, onBack }) {
  const {
    verdict,
    amountOutput,
    rateBand,
    apr,
    emiOutput,
    stress,
    confidence,
  } = result;
  const vcopy = VERDICT_COPY[verdict.verdict];
  const isDontBorrow = verdict.verdict === "DONT_BORROW";

  return (
    <div className="results-screen">
      {/* O1 — Verdict, always shown */}
      <section className={`verdict-banner tone-${vcopy.tone}`}>
        <h2>{vcopy.label}</h2>
        <p>{verdict.reason}</p>
        {verdict.alternative && (
          <p className="verdict-alt">{verdict.alternative}</p>
        )}
      </section>

      {isDontBorrow ? (
        // When the answer is "don't borrow," showing a ₹0 amount/rate/EMI
        // breakdown reads as a broken app, not a considered answer. Instead
        // we explain the underlying numbers in plain terms and stop there —
        // there's nothing to negotiate with a lender yet.
        <section className="result-card">
          <h3>Why there's no borrowing plan below</h3>
          <p className="why-text">
            Once your existing obligations and essential expenses are covered,
            there is no safe room left in your monthly budget for a new EMI — so
            we're not showing a lender-sanction range, a rate, or an EMI
            ceiling, because none of them would be a real number you should act
            on.
          </p>
          <p className="why-text">{amountOutput.emiCap.safeWhy}</p>
        </section>
      ) : (
        <>
          {/* O2 — Max amount */}
          <section className="result-card">
            <h3>How much you can borrow</h3>
            <div className="two-col">
              <div>
                <div className="stat-label">A lender might sanction</div>
                <div className="stat-value">
                  {inr(amountOutput.lenderBand.low)} –{" "}
                  {inr(amountOutput.lenderBand.high)}
                </div>
              </div>
              <div>
                <div className="stat-label">You can safely carry</div>
                <div className="stat-value">
                  {inr(amountOutput.safeBand.low)} –{" "}
                  {inr(amountOutput.safeBand.high)}
                </div>
              </div>
            </div>
            <p className="use-this-note">
              Use the{" "}
              {amountOutput.recommendedUse === "safe" ? "safe" : "lender"}{" "}
              number: {amountOutput.recommendationWhy}
            </p>
            <p className="why-text">{amountOutput.emiCap.safeWhy}</p>
          </section>

          {/* O3 — Rate */}
          <section className="result-card">
            <h3>Fair interest rate for you</h3>
            <div className="stat-value">
              {rateBand.low.toFixed(1)}% – {rateBand.high.toFixed(1)}%
            </div>
            <p className="why-text">
              All-in cost including processing fee works out to about{" "}
              <strong>{apr.aprPct.toFixed(1)}% APR</strong> on a{" "}
              {inr(result.amountToUse)} loan over {emiOutput.chosenTenureYears}{" "}
              years.
            </p>
            <ul className="adjustment-list">
              {rateBand.adjustments.map((a, i) => (
                <li key={i}>{a.why}</li>
              ))}
            </ul>
          </section>

          {/* O4 — EMI */}
          <section className="result-card">
            <h3>EMI you should agree to</h3>
            <div className="stat-value">
              {inr(emiOutput.emiCeiling)} / month ceiling
            </div>
            <p className="why-text">{emiOutput.ceilingWhy}</p>
            <table className="tradeoff-table">
              <thead>
                <tr>
                  <th>Tenure</th>
                  <th>EMI</th>
                  <th>Total interest</th>
                </tr>
              </thead>
              <tbody>
                {emiOutput.tradeoff.map((t) => (
                  <tr
                    key={t.years}
                    className={
                      t.years === emiOutput.chosenTenureYears
                        ? "chosen-row"
                        : ""
                    }
                  >
                    <td>{t.years} yrs</td>
                    <td>{inr(t.emi)}</td>
                    <td>{inr(t.totalInterest)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="stress-box">
              <strong>Stress test:</strong> {stress.why}
            </div>
          </section>
        </>
      )}

      {/* Confidence note — always shown, even for DONT_BORROW, since it's still honest about how firm that verdict is */}
      <section className="confidence-note">
        {confidence.total === 0 ? (
          <p>
            These numbers use every question that applied to your situation.
          </p>
        ) : (
          <p>
            Based on {confidence.answered} of {confidence.total} optional
            questions answered — answering more would sharpen this picture.{" "}
            {confidence.missing.length > 0 && (
              <>
                Skipped: affects{" "}
                {[
                  ...new Set(
                    confidence.missing.flatMap((m) => m.moves.split(", ")),
                  ),
                ].join(", ")}
                .
              </>
            )}
          </p>
        )}
      </section>

      {/* Negotiation Card only makes sense if there's actually something to negotiate */}
      {!isDontBorrow && (
        <NegotiationCard result={result} answers={result.answers} />
      )}

      <button className="secondary-btn" onClick={onBack}>
        ← Back to questions
      </button>
    </div>
  );
}
