import {
  AUTHORIZATION_STATUSES,
  formatSimulatedUsdcAmount,
  isScoutWalletPayment,
  isPaymentSelected,
} from "./booking-review-session";
import BookingJourney from "./BookingJourney";
import { formatAirlineDisplay } from "../flight/airlineDisplay";

export default function ReviewAuthorize({ session, onAuthorize, onChangePayment, onBack }) {
  const itinerary = session.itinerary;
  const authorization = session.authorization;
  const isAuthorized = authorization.status === AUTHORIZATION_STATUSES.AUTHORIZED;
  const canAuthorize = isPaymentSelected(session.payment) && !isAuthorized;
  const total = itinerary?.price?.amount || "Price unavailable";
  const simulatedUsdcAmount = isScoutWalletPayment(session.payment)
    ? formatSimulatedUsdcAmount(itinerary?.price?.amount)
    : null;
  const authorizationAmount = simulatedUsdcAmount ? `${total} = ${simulatedUsdcAmount}` : total;

  return (
    <section className="scout-review-authorize" aria-label="Review and authorize">
      <button type="button" className="scout-booking-back" onClick={onBack}>
        ← Back
      </button>
      <header className="scout-review-authorize-header">
        <div className="scout-booking-kicker">FINAL REVIEW</div>
        <h1>Ready to book</h1>
        <p>Review everything below before authorizing SCOUT to complete the booking.</p>
      </header>

      <section className="scout-authorize-section" aria-label="Travellers">
        <div className="scout-authorize-section-title">TRAVELLER DETAILS</div>
        <div className="scout-authorize-travellers">
          {session.identity.travellers.map((traveller) => (
            <div key={traveller.id}>
              <span><strong>{traveller.name}</strong> · {traveller.type}</span>
              <em>✓ Ready</em>
            </div>
          ))}
        </div>
      </section>

      <section className="scout-authorize-section" aria-label="Flight itinerary">
        <div className="scout-authorize-section-title">FLIGHT ITINERARY</div>
        {session.summary?.route && <strong className="scout-authorize-route">{session.summary.route}</strong>}
        {session.summary?.dates && <span className="scout-authorize-meta">{session.summary.dates}</span>}
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

      <section className="scout-authorize-section" aria-label="Payment method">
        <div className="scout-authorize-section-title">PAYMENT</div>
        <div className="scout-authorize-payment">
          <strong>{session.payment.display?.label || "Payment method unavailable"}</strong>
          {session.payment.display?.asset && <span>{session.payment.display.asset} · Simulated</span>}
          {session.payment.display?.brand && <span>Simulated saved card</span>}
          <em>✓ Selected</em>
        </div>
        <button type="button" className="scout-authorize-change" onClick={onChangePayment}>
          Change payment method
        </button>
      </section>

      <section className="scout-authorize-total" aria-label="Final total">
        <span>FINAL TOTAL</span>
        <strong>
          {total}
          {simulatedUsdcAmount ? <span className="scout-simulated-usdc"> = {simulatedUsdcAmount}</span> : null}
        </strong>
        <p>Baggage and fare conditions will be confirmed before purchase.</p>
      </section>

      <section className="scout-authorize-explanation">
        <strong>Authorization gives SCOUT permission to act.</strong>
        <p>By authorizing, you&apos;re asking SCOUT to use the selected payment method and traveller details to complete this booking for the final total shown above.</p>
        <span>Nothing will be charged until you authorize.</span>
      </section>

      <button
        type="button"
        className="scout-authorize-cta"
        disabled={!canAuthorize}
        onClick={() => onAuthorize?.()}
      >
        {isAuthorized ? "Authorization recorded ✓" : `Authorize SCOUT to complete booking · ${authorizationAmount}`}
      </button>
      {isAuthorized && (
        <p className="scout-authorize-local-note" aria-live="polite">
          Authorization was recorded locally. No payment or booking was executed.
        </p>
      )}
    </section>
  );
}
