// src/components/NegotiationCard.jsx

function inr(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

const PRODUCT_LABELS = {
  personal_loan_unsecured: "Personal Loan",
  home_loan: "Home Loan",
  loan_against_property_or_gold: "Loan Against Property / Gold",
  vehicle_loan: "Vehicle Loan",
  business_loan_secured: "Secured Business Loan",
  business_loan_unsecured: "Unsecured Business Loan",
};

export default function NegotiationCard({ result, answers }) {
  const {
    product,
    rateBand,
    apr,
    amountOutput,
    emiOutput,
    verdict,
    amountToUse,
  } = result;
  const quotedRate = Number(answers.existingOffer);
  const hasQuote = !Number.isNaN(quotedRate) && quotedRate > 0;

  return (
    <div className="negotiation-card" id="negotiation-card">
      <div className="card-header">
        <div className="card-title">Negotiation Card</div>
        <div className="card-product">
          {PRODUCT_LABELS[product.product] || product.product}
        </div>
      </div>

      <div className="card-row card-verdict-row">
        <span>{verdict.verdict.replace("_", " ")}</span>
      </div>

      <div className="card-grid">
        <div className="card-field">
          <div className="card-field-label">Fair rate for your profile</div>
          <div className="card-field-value">
            {rateBand.low.toFixed(1)}% – {rateBand.high.toFixed(1)}%
          </div>
        </div>

        {hasQuote && (
          <div className="card-field">
            <div className="card-field-label">Lender quoted you</div>
            <div
              className={`card-field-value ${quotedRate > rateBand.high ? "flag-bad" : "flag-good"}`}
            >
              {quotedRate.toFixed(1)}%
              {quotedRate > rateBand.high && " — above fair range"}
            </div>
          </div>
        )}

        <div className="card-field">
          <div className="card-field-label">All-in cost (APR, incl. fees)</div>
          <div className="card-field-value">{apr.aprPct.toFixed(1)}%</div>
        </div>

        <div className="card-field">
          <div className="card-field-label">Borrow amount to ask for</div>
          <div className="card-field-value">{inr(amountToUse)}</div>
        </div>

        <div className="card-field">
          <div className="card-field-label">
            EMI ceiling — don't agree above this
          </div>
          <div className="card-field-value">{inr(emiOutput.emiCeiling)}/mo</div>
        </div>

        <div className="card-field">
          <div className="card-field-label">Tenure</div>
          <div className="card-field-value">
            {emiOutput.chosenTenureYears} years
          </div>
        </div>
      </div>

      <div className="card-why">
        <strong>Why:</strong> {rateBand.adjustments.map((a) => a.why).join(" ")}
      </div>

      {hasQuote && quotedRate > rateBand.high && (
        <div className="card-script">
          Say this: "Your quote of {quotedRate.toFixed(1)}% is above the fair
          range for my profile of {rateBand.low.toFixed(1)}–
          {rateBand.high.toFixed(1)}%. Can you match closer to that, or explain
          what's pushing it higher?"
        </div>
      )}
    </div>
  );
}
