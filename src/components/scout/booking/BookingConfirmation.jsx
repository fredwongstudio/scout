import BookingJourney from "./BookingJourney";
import { formatAirlineDisplay } from "../flight/airlineDisplay";

function getDestination(route) {
  return route?.split(" → ").at(-1) || "your destination";
}

export default function BookingConfirmation({ session, onViewTrip, onDone }) {
  const itinerary = session.itinerary;
  const destination = getDestination(session.summary?.route);

  return (
    <section className="scout-booking-confirmation" aria-label="Demo booking confirmation">
      <header className="scout-confirmation-header">
        <div className="scout-booking-kicker">DEMO BOOKING CONFIRMATION</div>
        <h1>You&apos;re going to {destination} 🎉</h1>
        <p>Your booking is confirmed.</p>
      </header>

      <section className="scout-confirmation-status">
        <strong>✓ Booking confirmed</strong>
        <div><span>Booking reference</span><em>{session.execution.bookingReference}</em></div>
        <div><span>Transaction reference</span><em>{session.execution.transactionReference}</em></div>
      </section>

      <section className="scout-confirmation-section" aria-label="Trip summary">
        <div className="scout-confirmation-section-title">YOUR TRIP</div>
        {session.summary?.route && <strong>{session.summary.route}</strong>}
        {session.summary?.dates && <span>{session.summary.dates}</span>}
        {itinerary.travellers && <span>{itinerary.travellers}</span>}
      </section>

      <section className="scout-confirmation-section" aria-label="Flight details">
        <div className="scout-confirmation-section-title">FLIGHT DETAILS</div>
        <div className="scout-confirmation-flight">
          <strong>
            {formatAirlineDisplay(itinerary)}
            {itinerary.flightIdentifier ? ` · ${itinerary.flightIdentifier}` : ""}
          </strong>
          <BookingJourney fallbackLabel="OUTBOUND" journey={itinerary.outbound} />
          <div className="scout-booking-divider" />
          <BookingJourney fallbackLabel="RETURN" journey={itinerary.return} />
        </div>
      </section>

      <section className="scout-confirmation-section" aria-label="Travellers">
        <div className="scout-confirmation-section-title">TRAVELLERS</div>
        <div className="scout-confirmation-travellers">
          {session.identity.travellers.map((traveller) => (
            <div key={traveller.id}>
              <strong>{traveller.name}</strong>
              <span>{traveller.type}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="scout-confirmation-payment" aria-label="Simulated payment summary">
        <div className="scout-confirmation-section-title">SIMULATED PAYMENT</div>
        <strong>
          {session.payment.display?.label || "Payment method unavailable"}
          {session.payment.display?.asset ? ` · ${session.payment.display.asset}` : ""}
        </strong>
        <span>Total paid</span>
        <em>{itinerary.price?.amount || "Price unavailable"}</em>
        <p>Demo transaction — no real payment was made.</p>
      </section>

      <section className="scout-confirmation-message">
        <strong>Done — your simulated flight booking is sorted.</strong>
        <span>This was a simulated agentic transaction.</span>
      </section>

      <div className="scout-confirmation-actions">
        <button type="button" className="scout-booking-continue" onClick={onViewTrip}>View trip</button>
        <button type="button" className="scout-confirmation-done" onClick={onDone}>Back to chat</button>
      </div>
    </section>
  );
}
