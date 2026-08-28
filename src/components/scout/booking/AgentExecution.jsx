import { useEffect } from "react";

import {
  EXECUTION_STATUSES,
  advanceExecution,
  formatSimulatedUsdcAmount,
  getPaymentExecutionCopy,
  isAuthorizationBindingCurrent,
  isScoutWalletPayment,
  startExecution,
} from "./booking-review-session";

const STEP_COPY = {
  FARE: { active: "Checking final fare...", complete: "Final fare confirmed" },
  TRAVELLERS: { active: "Sharing traveller details...", complete: "Traveller details accepted" },
  BOOKING: { active: "Creating booking...", complete: "Booking created" },
  TICKETING: { active: "Issuing tickets...", complete: "Tickets issued" },
};

const STEP_DELAY_MS = 650;

function getStepCopy(step, payment) {
  return step.key === "PAYMENT"
    ? getPaymentExecutionCopy(payment)
    : STEP_COPY[step.key];
}

export default function AgentExecution({ session, onExecutionChange, onReturnToReview, onViewBooking }) {
  const execution = session.execution;
  const bindingIsCurrent = isAuthorizationBindingCurrent(session);
  const isComplete = execution.status === EXECUTION_STATUSES.COMPLETED;
  const simulatedUsdcAmount = isScoutWalletPayment(session.payment)
    ? formatSimulatedUsdcAmount(session.itinerary?.price?.amount)
    : null;

  useEffect(() => {
    if (!bindingIsCurrent || execution.status !== EXECUTION_STATUSES.NOT_STARTED) {
      return undefined;
    }

    onExecutionChange(startExecution());
    return undefined;
  }, [bindingIsCurrent, execution.status, onExecutionChange]);

  useEffect(() => {
    if (!bindingIsCurrent || execution.status !== EXECUTION_STATUSES.IN_PROGRESS) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onExecutionChange(advanceExecution(execution));
    }, STEP_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [bindingIsCurrent, execution, onExecutionChange]);

  if (!bindingIsCurrent) {
    return (
      <section className="scout-agent-execution scout-agent-execution-unavailable" aria-label="Authorization needs review">
        <div className="scout-booking-kicker">AUTHORIZATION CHECK</div>
        <h1>Review needed</h1>
        <p>The prepared booking details changed or are no longer authorized. Please review and authorize again.</p>
        <button type="button" className="scout-booking-continue" onClick={onReturnToReview}>
          Return to review
        </button>
      </section>
    );
  }

  return (
    <section className="scout-agent-execution" aria-label="SCOUT booking execution">
      <header className="scout-agent-execution-header">
        <div className="scout-booking-kicker">AGENT EXECUTION · SIMULATED</div>
        <h1>SCOUT is booking your flight</h1>
        <p>You can sit back — I&apos;ll take it from here.</p>
      </header>

      <section className="scout-execution-context">
        {session.summary?.route && <strong>{session.summary.route}</strong>}
        {session.summary?.dates && <span>{session.summary.dates}</span>}
        {session.itinerary?.travellers && <span>{session.itinerary.travellers}</span>}
        <em>
          {session.itinerary?.price?.amount || "Price unavailable"}
          {simulatedUsdcAmount ? <span className="scout-simulated-usdc"> = {simulatedUsdcAmount}</span> : null}
        </em>
      </section>

      <ol className="scout-execution-timeline">
        {execution.steps.map((step) => {
          const copy = getStepCopy(step, session.payment);
          const isDone = step.status === "COMPLETED";
          const isActive = step.status === "IN_PROGRESS";

          return (
            <li key={step.key} className={isDone ? "is-complete" : isActive ? "is-active" : ""}>
              <i aria-hidden="true">{isDone ? "✓" : isActive ? "◉" : "○"}</i>
              <span>{isDone ? copy.complete : copy.active}</span>
            </li>
          );
        })}
      </ol>

      {isComplete && (
        <section className="scout-execution-complete" aria-live="polite">
          <strong>✓ SCOUT&apos;s simulated booking flow is complete</strong>
          <span>Demo booking reference: {execution.bookingReference}</span>
          <span>Demo transaction reference: {execution.transactionReference}</span>
        </section>
      )}

      <button
        type="button"
        className="scout-booking-continue scout-execution-view-booking"
        disabled={!isComplete}
        onClick={() => onViewBooking?.()}
      >
        View booking <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
