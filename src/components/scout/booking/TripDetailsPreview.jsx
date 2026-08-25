import TripDetails from "./TripDetails";
import {
  advanceExecution,
  BOOKING_VIEWS,
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
  view: BOOKING_VIEWS.TRIP_DETAILS,
  identity: createReadyIdentity(IDENTITY_METHODS.SCOUT_TRAVEL_ID, baseSession.itinerary.travellers),
  payment: createSelectedPayment(PAYMENT_METHODS.SCOUT_WALLET_USDC),
};
const authorizedSession = {
  ...preparedSession,
  authorization: createAuthorizedState(preparedSession),
};
let execution = startExecution();
for (let index = 0; index < execution.steps.length; index += 1) {
  execution = advanceExecution(execution);
}
const previewSession = { ...authorizedSession, execution };

export default function TripDetailsPreview() {
  return (
    <main className="scout-booking-preview-page">
      <div className="scout-flight-preview-brand">SCOUT</div>
      <TripDetails session={previewSession} onBack={() => {}} />
    </main>
  );
}
