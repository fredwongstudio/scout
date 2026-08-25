import {
  PAYMENT_METHODS,
  SIMULATED_PAYMENT_DISPLAY,
  isPaymentSelected,
} from "./booking-review-session";

function PaymentOption({ title, detail, description, selected, onSelect, primary }) {
  return (
    <article className={`scout-payment-option${primary ? " scout-payment-option-primary" : ""}${selected ? " scout-payment-option-selected" : ""}`}>
      {primary && (
        <div className="scout-payment-badge">
          FASTEST · AGENT-READY
          <span>PREFERRED</span>
        </div>
      )}
      {selected && <div className="scout-payment-option-selected-label">✓ SELECTED</div>}
      <h2>{title}</h2>
      <div className="scout-payment-detail">{detail}</div>
      {description && <p>{description}</p>}
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
      >
        {selected ? "✓ Selected" : `Use ${title}`}
      </button>
    </article>
  );
}

export default function PaymentMethod({ session, onPaymentChange, onContinue, onBack }) {
  const payment = session.payment;
  const walletSelected = payment.method === PAYMENT_METHODS.SCOUT_WALLET_USDC;
  const cardSelected = payment.method === PAYMENT_METHODS.SAVED_CARD;
  const wallet = walletSelected
    ? payment.display
    : SIMULATED_PAYMENT_DISPLAY[PAYMENT_METHODS.SCOUT_WALLET_USDC];
  const card = cardSelected
    ? payment.display
    : SIMULATED_PAYMENT_DISPLAY[PAYMENT_METHODS.SAVED_CARD];

  return (
    <section className="scout-payment-method" aria-label="Payment method">
      <button type="button" className="scout-booking-back" onClick={onBack}>
        ← Back
      </button>
      <header className="scout-payment-method-header">
        <div className="scout-booking-kicker">PAYMENT METHOD</div>
        <h1>How would you like to pay?</h1>
        <p>Choose the payment method SCOUT should use for this booking.</p>
      </header>

      <section className="scout-payment-context" aria-label="Booking context">
        {session.summary?.route && <strong>{session.summary.route}</strong>}
        {session.itinerary?.travellers && <span>{session.itinerary.travellers}</span>}
        <div>
          <span>Flight total</span>
          <strong>{session.itinerary?.price?.amount || "Price unavailable"}</strong>
        </div>
      </section>

      <section className="scout-payment-options" aria-label="Payment options">
        <PaymentOption
          primary
          title="SCOUT Wallet"
          detail={`${wallet.asset} · ${wallet.availableBalance}`}
          description="A simulated SCOUT Wallet for this prototype."
          selected={walletSelected}
          onSelect={() => onPaymentChange(PAYMENT_METHODS.SCOUT_WALLET_USDC)}
        />
        <PaymentOption
          title="Saved card"
          detail={card.label}
          description="A simulated saved card for this prototype."
          selected={cardSelected}
          onSelect={() => onPaymentChange(PAYMENT_METHODS.SAVED_CARD)}
        />
      </section>

      {isPaymentSelected(payment) && (
        <div className="scout-payment-selected-state" aria-live="polite">
          ✓ {payment.display.label} selected
        </div>
      )}

      <div className="scout-payment-control">
        No payment will be made until you review and authorize the booking.
      </div>

      <button
        type="button"
        className="scout-booking-continue scout-payment-authorize"
        disabled={!isPaymentSelected(payment)}
        onClick={() => onContinue?.()}
      >
        Review &amp; authorize <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
