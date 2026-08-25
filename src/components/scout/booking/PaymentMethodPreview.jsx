import { useState } from "react";

import PaymentMethod from "./PaymentMethod";
import {
  createBookingReviewSession,
  createPaymentState,
  createReadyIdentity,
  IDENTITY_METHODS,
} from "./booking-review-session";
import { previewFlightResult } from "../flight/FlightCardsPreview";

const baseSession = createBookingReviewSession({
  summary: previewFlightResult.summary,
  itinerary: previewFlightResult.cards[0],
});

const previewSession = {
  ...baseSession,
  stage: "PAYMENT",
  identity: createReadyIdentity(
    IDENTITY_METHODS.SCOUT_TRAVEL_ID,
    baseSession.itinerary.travellers,
  ),
  payment: createPaymentState(),
};

export default function PaymentMethodPreview() {
  const [session, setSession] = useState(previewSession);

  return (
    <main className="scout-booking-preview-page">
      <div className="scout-flight-preview-brand">SCOUT</div>
      <PaymentMethod
        session={session}
        onPaymentChange={(payment) => setSession((current) => ({ ...current, payment }))}
      />
    </main>
  );
}
