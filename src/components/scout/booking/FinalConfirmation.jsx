import BookingJourney from "./BookingJourney";
import { formatAirlineDisplay } from "../flight/airlineDisplay";

function TravellerRecord({ traveller }) {
  return (
    <div>
      <span>
        <strong>{traveller.name}</strong>
        {traveller.type ? ` · ${traveller.type}` : ""}
      </span>
      {traveller.status ? <em>✓ {traveller.status === "READY" ? "Ready" : traveller.status}</em> : null}
    </div>
  );
}

export default function FinalConfirmation({ session, onContinue, onBack }) {
  const itinerary = session?.itinerary;
  const travellers = session?.identity?.travellers || [];

  if (!itinerary) return null;

  return (
    <section className="scout-final-confirmation" aria-label="Final confirmation">
      <button type="button" className="scout-booking-back" onClick={onBack}>
        ← Back
      </button>

      <header className="scout-final-confirmation-header">
        <div className="scout-booking-kicker">FINAL CONFIRMATION</div>
        <h1>Final Confirmation</h1>
        <p>Please check your traveller and flight details before continuing to payment.</p>
      </header>

      <section className="scout-final-confirmation-section" aria-label="Traveller details">
        <div className="scout-final-confirmation-section-title">TRAVELLER DETAILS</div>
        <div className="scout-final-confirmation-travellers">
          {travellers.map((traveller) => (
            <TravellerRecord key={traveller.id} traveller={traveller} />
          ))}
        </div>
      </section>

      <section className="scout-final-confirmation-section" aria-label="Flight itinerary">
        <div className="scout-final-confirmation-section-title">FLIGHT ITINERARY</div>
        {session.summary?.route ? <strong className="scout-final-confirmation-route">{session.summary.route}</strong> : null}
        {session.summary?.dates ? <span className="scout-final-confirmation-meta">{session.summary.dates}</span> : null}
        <article className="scout-booking-itinerary" data-itinerary-id={itinerary.id}>
          <header className="scout-booking-itinerary-header">
            <div className="scout-booking-itinerary-label">SELECTED FLIGHT</div>
            <div className="scout-booking-airline">
              {formatAirlineDisplay(itinerary)}
              {itinerary.flightIdentifier ? ` · ${itinerary.flightIdentifier}` : ""}
            </div>
          </header>
          <div className="scout-booking-itinerary-body">
            <BookingJourney journey={itinerary.outbound} fallbackLabel="OUTBOUND" />
            <div className="scout-booking-divider" />
            <BookingJourney journey={itinerary.return} fallbackLabel="RETURN" />
          </div>
        </article>
      </section>

      <section className="scout-booking-fare" aria-label="Fare details">
        <div className="scout-booking-section-title">FARE</div>
        {itinerary.fare ? <div className="scout-booking-fare-type">{itinerary.fare}</div> : null}
        <div className="scout-booking-fare-total">
          <span>TOTAL</span>
          <strong>{itinerary.price?.amount || "Price unavailable"}</strong>
        </div>
        {itinerary.travellers ? (
          <div className="scout-booking-fare-travellers">
            {itinerary.travellers}
          </div>
        ) : null}
        {itinerary.price?.perPersonAmount ? (
          <div className="scout-booking-per-person">
            {itinerary.price.perPersonAmount}<span> per person</span>
          </div>
        ) : null}
      </section>

      <p className="scout-final-confirmation-safety">
        Please check these details carefully before continuing. You&apos;ll choose your payment method next.
      </p>

      <button type="button" className="scout-booking-continue" onClick={onContinue}>
        Confirm &amp; Continue to Payment <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
