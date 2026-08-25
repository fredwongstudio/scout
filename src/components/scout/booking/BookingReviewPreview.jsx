import { useState } from "react";

import BookingReview from "./BookingReview";
import { createBookingReviewSession } from "./booking-review-session";
import { previewFlightResult } from "../flight/FlightCardsPreview";

const previewSession = createBookingReviewSession({
  summary: previewFlightResult.summary,
  itinerary: previewFlightResult.cards[0],
});

export default function BookingReviewPreview() {
  const [session, setSession] = useState(previewSession);

  return (
    <main className="scout-booking-preview-page">
      <div className="scout-flight-preview-brand">SCOUT</div>
      <BookingReview
        session={session}
        onRevalidationComplete={() => setSession((current) => ({
          ...current,
          offerRevalidated: true,
        }))}
      />
    </main>
  );
}
