import { useEffect, useState } from "react";
import { isValidConfirmationEmail } from "./trip-details-utils";
import { formatAirlineDisplay } from "../flight/airlineDisplay";

function getDestination(route) {
  return route?.split(" → ").at(-1) || "your";
}

function TripJourney({ journey, title }) {
  if (!journey) return null;

  return (
    <section className="scout-trip-journey">
      <div className="scout-trip-journey-label">{journey.label || title}</div>
      <div className="scout-trip-journey-route">
        <div>
          <strong>{journey.departureTime || "--:--"}</strong>
          <span>{journey.departureAirport || "—"}</span>
        </div>
        <div className="scout-trip-journey-middle">
          <span>{journey.duration || "Duration unavailable"}</span>
          <i aria-hidden="true" />
          <em className={journey.stops === "Direct" ? "scout-booking-direct" : ""}>{journey.stops || "Stops unavailable"}</em>
        </div>
        <div>
          <strong>{journey.arrivalTime || "--:--"}</strong>
          <span>{journey.arrivalAirport || "—"}</span>
        </div>
      </div>
    </section>
  );
}

export default function TripDetails({ session, onBack }) {
  const itinerary = session.itinerary;
  const [emailPanelOpen, setEmailPanelOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("IDLE");
  const [sentTo, setSentTo] = useState(null);

  useEffect(() => {
    if (emailStatus !== "SENDING") return undefined;

    const timer = window.setTimeout(() => {
      setSentTo(email.trim());
      setEmailStatus("SENT");
    }, 500);

    return () => window.clearTimeout(timer);
  }, [email, emailStatus]);

  const submitEmailConfirmation = (event) => {
    event.preventDefault();
    if (!isValidConfirmationEmail(email)) return;
    setEmailStatus("SENDING");
  };

  return (
    <section className="scout-trip-details" aria-label="Trip details">
      <button type="button" className="scout-trip-back" onClick={onBack}>← Back to confirmation</button>
      <header className="scout-trip-details-header">
        <div className="scout-booking-kicker">YOUR TRIP</div>
        <h1>Your {getDestination(session.summary?.route)} trip</h1>
        <p>✓ Booking confirmed</p>
        <span>Booking reference · {session.execution.bookingReference}</span>
      </header>

      <section className="scout-trip-actions" aria-label="Trip document actions">
        <button type="button" onClick={() => window.print()}>Print / Save PDF</button>
        <button type="button" onClick={() => setEmailPanelOpen((open) => !open)}>Email confirmation</button>
      </section>

      {emailPanelOpen && (
        <section className="scout-trip-email-panel" aria-label="Email booking confirmation">
          <div className="scout-trip-email-title">Email booking confirmation</div>
          {emailStatus === "SENT" ? (
            <div className="scout-trip-email-sent" aria-live="polite">
              ✓ Confirmation sent to {sentTo}
              <span>Demo only — no email was actually sent.</span>
            </div>
          ) : (
            <form onSubmit={submitEmailConfirmation}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@example.com"
                aria-label="Email address"
                disabled={emailStatus === "SENDING"}
              />
              <button
                type="submit"
                disabled={!isValidConfirmationEmail(email) || emailStatus === "SENDING"}
              >
                {emailStatus === "SENDING" ? "Sending..." : "Send confirmation"}
              </button>
            </form>
          )}
          {emailStatus !== "SENT" && (
            <span className="scout-trip-email-note">Demo only — no email will be sent.</span>
          )}
        </section>
      )}

      <section className="scout-trip-section" aria-label="Flights">
        <div className="scout-trip-section-title">FLIGHTS</div>
        {session.summary?.route && <strong className="scout-trip-route">{session.summary.route}</strong>}
        <div className="scout-trip-flight-card">
          <div className="scout-trip-airline">
            {formatAirlineDisplay(itinerary)}
            {itinerary.flightIdentifier ? ` · ${itinerary.flightIdentifier}` : ""}
          </div>
          <TripJourney title="OUTBOUND" journey={itinerary.outbound} />
          <div className="scout-booking-divider" />
          <TripJourney title="RETURN" journey={itinerary.return} />
        </div>
      </section>

      <section className="scout-trip-section" aria-label="Travellers">
        <div className="scout-trip-section-title">TRAVELLERS</div>
        <div className="scout-trip-travellers">
          {session.identity.travellers.map((traveller) => (
            <div key={traveller.id}>
              <strong>{traveller.name}</strong>
              <span>{traveller.type}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="scout-trip-payment" aria-label="Demo transaction">
        <div className="scout-trip-section-title">PAYMENT</div>
        <strong>
          {session.payment.display?.label || "Payment method unavailable"}
          {session.payment.display?.asset ? ` · ${session.payment.display.asset}` : ""}
        </strong>
        <em>{itinerary.price?.amount || "Price unavailable"}</em>
        <span>Demo transaction</span>
      </section>

      <section className="scout-trip-references" aria-label="Booking references">
        <div><span>Booking reference</span><strong>{session.execution.bookingReference}</strong></div>
        <div><span>Transaction reference</span><strong>{session.execution.transactionReference}</strong></div>
      </section>
    </section>
  );
}
