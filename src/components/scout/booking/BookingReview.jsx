import { useEffect } from "react";
import BookingJourney from "./BookingJourney";
import { formatAirlineDisplay } from "../flight/airlineDisplay";

const REVALIDATION_DELAY_MS = 450;

export default function BookingReview({ session, onContinue, onBack, onRevalidationComplete }) {
  const itinerary = session?.itinerary;
  const isConfirmed = session?.offerRevalidated === true;
  const offerStage = isConfirmed ? "OFFER_READY" : "REVALIDATING";

  useEffect(() => {
    if (isConfirmed) return undefined;

    const timer = window.setTimeout(onRevalidationComplete, REVALIDATION_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isConfirmed, itinerary?.id, onRevalidationComplete]);

  if (!itinerary) return null;

  return (
    <section
      className="scout-booking-review"
      aria-label="Booking review"
      data-booking-stage={offerStage}
    >
      <button type="button" className="scout-booking-back" onClick={onBack}>
        ← Back
      </button>
      <header className="scout-booking-review-header">
        <div className="scout-booking-kicker">BOOKING REVIEW</div>
        <h1>Booking your flight</h1>
        {session.summary?.route && <div className="scout-booking-route-summary">{session.summary.route}</div>}
        {session.summary?.dates && <div className="scout-booking-summary-meta">{session.summary.dates}</div>}
        {session.summary?.travellers && <div className="scout-booking-summary-meta">{session.summary.travellers}</div>}
      </header>

      <article className="scout-booking-itinerary" data-itinerary-id={itinerary.id}>
        <header className="scout-booking-itinerary-header">
          <div className="scout-booking-itinerary-label">SELECTED FLIGHT</div>
          <div className="scout-booking-airline">
            {formatAirlineDisplay(itinerary)}
            {itinerary.flightIdentifier ? ` · ${itinerary.flightIdentifier}` : ""}
          </div>
        </header>
        <div className="scout-booking-itinerary-body">
          <BookingJourney journey={itinerary.outbound} />
          <div className="scout-booking-divider" />
          <BookingJourney journey={itinerary.return} />
        </div>
      </article>

      <section className="scout-booking-revalidation" aria-live="polite">
        <div className="scout-booking-revalidation-status">
          {isConfirmed ? (
            <div className="scout-booking-commercial-status">
              <div><span aria-hidden="true">✓</span> Flight available</div>
              <div><span aria-hidden="true">✓</span> Price confirmed</div>
            </div>
          ) : (
            <><span className="scout-booking-checking-dot" aria-hidden="true" /> Checking latest availability and fare...</>
          )}
        </div>
        <div className="scout-booking-prototype-note">Prototype simulation</div>
      </section>

      <section className="scout-booking-fare" aria-label="Fare and booking details">
        <div className="scout-booking-section-title">YOUR FARE</div>
        {itinerary.fare && (
          <div className="scout-booking-fare-type">{itinerary.fare}</div>
        )}
        <div className="scout-booking-fare-total">
          <span>TOTAL</span>
          <strong>{itinerary.price?.amount || "Price unavailable"}</strong>
        </div>
        {itinerary.travellers && (
          <div className="scout-booking-fare-travellers">
            {itinerary.travellers}
          </div>
        )}
        {itinerary.price?.perPersonAmount && (
          <div className="scout-booking-per-person">
            {itinerary.price.perPersonAmount}<span> per person</span>
          </div>
        )}
        <div className="scout-booking-unknown-details">
          <div>
            <span>Baggage</span>
            <strong>To be confirmed before booking</strong>
          </div>
          <div>
            <span>Fare conditions</span>
            <strong>To be confirmed before booking</strong>
          </div>
        </div>
        <p className="scout-booking-commercial-note">
          Baggage and fare conditions will be confirmed before purchase.
        </p>
      </section>

      <button
        type="button"
        className="scout-booking-continue"
        onClick={onContinue}
        disabled={!isConfirmed}
      >
        Continue <span aria-hidden="true">→</span>
      </button>
      <p className="scout-booking-next-step">
        Next, I&apos;ll get the traveller details needed for the booking.
      </p>
    </section>
  );
}
