import { useState } from "react";

import ReviewAuthorize from "./ReviewAuthorize";
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

const previewSession = {
  ...baseSession,
  stage: "REVIEW_AUTHORIZE",
  identity: createReadyIdentity(IDENTITY_METHODS.SCOUT_TRAVEL_ID, baseSession.itinerary.travellers),
  payment: createSelectedPayment(PAYMENT_METHODS.SCOUT_WALLET_USDC),
};

export default function ReviewAuthorizePreview() {
  const [session, setSession] = useState(previewSession);

  return (
    <main className="scout-booking-preview-page">
      <div className="scout-flight-preview-brand">SCOUT</div>
      <ReviewAuthorize
        session={session}
        onAuthorize={() => setSession((current) => ({
          ...current,
          authorization: createAuthorizedState(current),
        }))}
        onChangePayment={() => setSession((current) => ({ ...current, stage: "PAYMENT" }))}
      />
    </main>
  );
}
