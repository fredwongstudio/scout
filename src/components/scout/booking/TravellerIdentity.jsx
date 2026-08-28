import { useEffect, useRef, useState } from "react";

import {
  createProcessingIdentity,
  createReadyIdentity,
  IDENTITY_METHODS,
  IDENTITY_STATUSES,
  isIdentityReadyForPayment,
} from "./booking-review-session";

const IDENTITY_DELAY_MS = 550;

const METHOD_COPY = {
  [IDENTITY_METHODS.SCOUT_TRAVEL_ID]: "Connecting to SCOUT Travel ID...",
  [IDENTITY_METHODS.PASSPORT_UPLOAD]: "Reading traveller details...",
  [IDENTITY_METHODS.MANUAL]: "Preparing traveller details...",
};

function IdentityRecord({ traveller }) {
  return (
    <article className="scout-identity-record">
      <div>
        <strong>{traveller.name}</strong>
        <span>{traveller.type}</span>
      </div>
      <div className="scout-identity-ready">✓ Identity ready</div>
    </article>
  );
}

export default function TravellerIdentity({ session, onIdentityChange, onContinue, onBack }) {
  const fileInputRef = useRef(null);
  const [manualOpen, setManualOpen] = useState(false);
  const identity = session.identity;
  const isProcessing = identity.status === IDENTITY_STATUSES.PROCESSING;
  const isReady = identity.status === IDENTITY_STATUSES.READY;
  const expectedTravellers = session.itinerary?.travellers || session.summary?.travellers;

  useEffect(() => {
    if (!isProcessing) return undefined;

    const timer = window.setTimeout(() => {
      onIdentityChange({
        ...createReadyIdentity(identity.method, expectedTravellers),
      });
    }, IDENTITY_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [expectedTravellers, identity.method, isProcessing, onIdentityChange]);

  const beginIdentityMethod = (method) => {
    setManualOpen(false);
    onIdentityChange(createProcessingIdentity(method));
  };

  const handlePassportSelection = (event) => {
    if (!event.target.files?.length) return;
    beginIdentityMethod(IDENTITY_METHODS.PASSPORT_UPLOAD);
    event.target.value = "";
  };

  const handleManualSubmit = (event) => {
    event.preventDefault();
    beginIdentityMethod(IDENTITY_METHODS.MANUAL);
  };

  return (
    <section className="scout-traveller-identity" aria-label="Traveller identity">
      <button type="button" className="scout-booking-back" onClick={onBack}>
        ← Back
      </button>
      <header className="scout-traveller-identity-header">
        <div className="scout-booking-kicker">TRAVELLER IDENTITY</div>
        <h1>Who&apos;s travelling?</h1>
        <p>SCOUT needs the traveller details required to book this flight.</p>
        {expectedTravellers && (
          <div className="scout-traveller-identity-count">{expectedTravellers}</div>
        )}
      </header>

      {!isReady && (
        <>
          <section className="scout-travel-id-option">
            <div className="scout-travel-id-badge">RECOMMENDED · FASTEST</div>
            <h2>Use SCOUT Travel ID</h2>
            <p>Use your saved, verified traveller details for this booking.</p>
            <span className="scout-travel-id-demo-note">Prototype simulation</span>
            <button
              type="button"
              className="scout-travel-id-action"
              disabled={isProcessing}
              onClick={() => beginIdentityMethod(IDENTITY_METHODS.SCOUT_TRAVEL_ID)}
            >
              Use Travel ID <span aria-hidden="true">→</span>
            </button>
          </section>

          <section className="scout-identity-alternatives" aria-label="Other identity options">
            <div>
              <strong>Upload passports</strong>
              <span>Use passport images to provide traveller details.</span>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                hidden
                onChange={handlePassportSelection}
              />
            </div>
            <div>
              <strong>Enter details manually</strong>
              <span>Enter the required traveller details yourself.</span>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setManualOpen((open) => !open)}
              >
                {manualOpen ? "Hide details" : "Enter details"}
              </button>
            </div>
          </section>

          {manualOpen && (
            <form className="scout-manual-identity" onSubmit={handleManualSubmit}>
              <div className="scout-manual-identity-title">Manual details · prototype only</div>
              <div className="scout-manual-identity-fields">
                <label>Given name<input required name="givenName" /></label>
                <label>Family name<input required name="familyName" /></label>
                <label>Date of birth<input required name="dateOfBirth" type="date" /></label>
                <label>Nationality<input required name="nationality" /></label>
                <label>Passport number<input required name="passportNumber" /></label>
                <label>Passport expiry<input required name="passportExpiry" type="date" /></label>
              </div>
              <button type="submit">Use demo traveller records</button>
            </form>
          )}
        </>
      )}

      {isProcessing && (
        <section className="scout-identity-processing" aria-live="polite">
          <span className="scout-booking-checking-dot" aria-hidden="true" />
          {METHOD_COPY[identity.method] || "Preparing traveller details..."}
        </section>
      )}

      {isReady && (
        <section className="scout-identity-ready-state">
          <div className="scout-identity-ready-title">
            Traveller details ready <span aria-hidden="true">✓</span>
          </div>
          <div className="scout-identity-records">
            {identity.travellers.map((traveller) => (
              <IdentityRecord key={traveller.id} traveller={traveller} />
            ))}
          </div>
          <div className="scout-identity-control">
            <strong>✓ You stay in control</strong>
            <span>Your traveller details won&apos;t be shared until you authorize the booking.</span>
          </div>
          <div className="scout-identity-all-ready">
            {identity.travellers.length} traveller{identity.travellers.length === 1 ? "" : "s"} ready ✓
          </div>
        </section>
      )}

      <button
        type="button"
        className="scout-booking-continue scout-identity-payment"
        disabled={!isIdentityReadyForPayment(identity, expectedTravellers)}
        onClick={() => onContinue?.()}
      >
        Continue to confirmation <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
