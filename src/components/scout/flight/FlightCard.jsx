import { toFlightCardModel } from "./flightCardModel";

const StopLabel = ({ stops }) => {
  if (stops === 0) {
    return <span className="scout-flight-direct">Direct</span>;
  }

  return (
    <span>
      {stops} stop{stops === 1 ? "" : "s"}
    </span>
  );
};

const Journey = ({ label, journey }) => {
  if (!journey) return null;

  return (
    <div className="scout-flight-journey">
      <div className="scout-flight-journey-header">
        <span>{label}</span>
        <span>
          {journey.duration || "Duration unavailable"} ·{" "}
          <StopLabel stops={journey.stops} />
        </span>
      </div>

      <div className="scout-flight-route">
        <div className="scout-flight-time">
          {journey.departure || "--:--"}
          <span>{journey.from || "—"}</span>
        </div>

        <div className="scout-flight-line">
          {journey.stops > 0 && (
            <div className="scout-flight-stop">
              <span />
              <span />
            </div>
          )}
        </div>

        <div className="scout-flight-time scout-flight-time-right">
          {journey.arrival || "--:--"}
          <span>{journey.to || "—"}</span>
        </div>
      </div>

      {journey.stops > 0 && journey.segments.length > 0 && (
        <div className="scout-flight-segments">
          {journey.segments.map((segment, index) => (
            <span key={`${segment.flightNumber || "segment"}-${index}`}>
              {segment.flightNumber || segment.airline || "Flight"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default function FlightCard({ data }) {
  console.log("[SCOUT FlightCard] renderer invoked:", data);

  const flight = toFlightCardModel(data);

  if (!flight) {
    return null;
  }

  const travellerParts = [];

  if (flight.passengers.adults) {
    travellerParts.push(
      `${flight.passengers.adults} adult${
        flight.passengers.adults === 1 ? "" : "s"
      }`
    );
  }

  if (flight.passengers.children) {
    travellerParts.push(
      `${flight.passengers.children} child${
        flight.passengers.children === 1 ? "" : "ren"
      }`
    );
  }

  if (flight.passengers.infants) {
    travellerParts.push(
      `${flight.passengers.infants} infant${
        flight.passengers.infants === 1 ? "" : "s"
      }`
    );
  }

  return (
    <article className="scout-flight-card">
      <header className="scout-flight-card-header">
        <div>
          <div className="scout-flight-airline">
            {flight.airline || "Airline unavailable"}
          </div>
          <div className="scout-flight-card-subtitle">
            Return flight
          </div>
        </div>

        <div className="scout-flight-fare">
          STANDARD
        </div>
      </header>

      <div className="scout-flight-card-body">
        <Journey
          label={`OUTBOUND${
            flight.outbound?.date
              ? ` · ${flight.outbound.date}`
              : ""
          }`}
          journey={flight.outbound}
        />

        <div className="scout-flight-divider" />

        <Journey
          label={`RETURN${
            flight.inbound?.date
              ? ` · ${flight.inbound.date}`
              : ""
          }`}
          journey={flight.inbound}
        />
      </div>

      <footer className="scout-flight-card-footer">
        <div>
          <div className="scout-flight-passengers">
            {travellerParts.join(" · ")}
          </div>

          <div className="scout-flight-price">
            {flight.price.formatted || "Price unavailable"}
          </div>

          <div className="scout-flight-price-label">
            Total trip price
          </div>
        </div>

        <button
          type="button"
          className="scout-flight-select"
        >
          Select flight
          <span aria-hidden="true">→</span>
        </button>
      </footer>
    </article>
  );
}
