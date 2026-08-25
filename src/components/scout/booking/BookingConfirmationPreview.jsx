import BookingConfirmation from "./BookingConfirmation";
import {
  advanceExecution,
  createAuthorizedState,
  createBookingReviewSession,
  createReadyIdentity,
  createSelectedPayment,
  IDENTITY_METHODS,
  PAYMENT_METHODS,
  startExecution,
} from "./booking-review-session";
import { previewFlightResult } from "../flight/FlightCardsPreview";

const baseSession = createBookingReviewSession({
  summary: previewFlightResult.summary,
  itinerary: previewFlightResult.cards[0],
});

const preparedSession = {
  ...baseSession,
  stage: "CONFIRMED",
  identity: createReadyIdentity(IDENTITY_METHODS.SCOUT_TRAVEL_ID, baseSession.itinerary.travellers),
  payment: createSelectedPayment(PAYMENT_METHODS.SCOUT_WALLET_USDC),
};

const authorizedSession = {
  ...preparedSession,
  authorization: createAuthorizedState(preparedSession),
};

let completedExecution = startExecution();
for (let index = 0; index < completedExecution.steps.length; index += 1) {
  completedExecution = advanceExecution(completedExecution);
}

const previewSession = {
  ...authorizedSession,
  execution: completedExecution,
};

export default function BookingConfirmationPreview() {
  return (
    <main className="scout-booking-preview-page">
      <div className="scout-flight-preview-brand">SCOUT</div>
      <BookingConfirmation session={previewSession} />
    </main>
  );
}
