import { useState } from "react";

import AgentExecution from "./AgentExecution";
import {
  createAuthorizedState,
  createBookingReviewSession,
  createReadyIdentity,
  createSelectedPayment,
  IDENTITY_METHODS,
  PAYMENT_METHODS,
} from "./booking-review-session";
import { previewFlightResult } from "../flight/FlightCardsPreview";

const baseSession = createBookingReviewSession({
  summary: previewFlightResult.summary,
  itinerary: previewFlightResult.cards[0],
});

const preparedSession = {
  ...baseSession,
  stage: "AGENT_EXECUTION",
  identity: createReadyIdentity(IDENTITY_METHODS.SCOUT_TRAVEL_ID, baseSession.itinerary.travellers),
  payment: createSelectedPayment(PAYMENT_METHODS.SCOUT_WALLET_USDC),
};

const previewSession = {
  ...preparedSession,
  authorization: createAuthorizedState(preparedSession),
};

export default function AgentExecutionPreview() {
  const [session, setSession] = useState(previewSession);

  return (
    <main className="scout-booking-preview-page">
      <div className="scout-flight-preview-brand">SCOUT</div>
      <AgentExecution
        session={session}
        onExecutionChange={(execution) => setSession((current) => ({ ...current, execution }))}
        onReturnToReview={() => setSession((current) => ({ ...current, stage: "REVIEW_AUTHORIZE" }))}
      />
    </main>
  );
}
