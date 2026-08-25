import TravellerIdentity from "./TravellerIdentity";
import {
  createBookingReviewSession,
  createDemoTravellers,
  IDENTITY_METHODS,
  IDENTITY_STATUSES,
} from "./booking-review-session";
import { previewFlightResult } from "../flight/FlightCardsPreview";

const baseSession = createBookingReviewSession({
  summary: previewFlightResult.summary,
  itinerary: previewFlightResult.cards[0],
});

const previewSession = {
  ...baseSession,
  stage: "TRAVELLER_IDENTITY",
  identity: {
    method: IDENTITY_METHODS.SCOUT_TRAVEL_ID,
    status: IDENTITY_STATUSES.READY,
    travellers: createDemoTravellers(baseSession.itinerary.travellers),
  },
};

export default function TravellerIdentityPreview() {
  return (
    <main className="scout-booking-preview-page">
      <div className="scout-flight-preview-brand">SCOUT</div>
      <TravellerIdentity session={previewSession} onIdentityChange={() => {}} />
    </main>
  );
}
