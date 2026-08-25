function Journey({ journey }) {
  if (!journey) return null;

  return (
    <div className="scout-flight-journey">
      <div className="scout-flight-journey-header">
        <span>{journey.label || "FLIGHT"}</span>
      </div>

      <div className="scout-flight-route">
        <div className="scout-flight-time">
          {journey.departureTime || "--:--"}
          <span>{journey.departureAirport || "—"}</span>
        </div>

        <div className="scout-flight-route-centre">
          <div className="scout-flight-duration">
            {journey.duration || "Duration unavailable"}
          </div>
          <div className="scout-flight-line" />
          <div
            className={
              journey.stops === "Direct"
                ? "scout-flight-stops scout-flight-direct"
                : "scout-flight-stops"
            }
          >
            {journey.stops || "Direct"}
          </div>
        </div>

        <div className="scout-flight-time scout-flight-time-right">
          {journey.arrivalTime || "--:--"}
          <span>{journey.arrivalAirport || "—"}</span>
        </div>
      </div>
    </div>
  );
}

export default function FlightCard({ data, onSelect }) {
  if (!data) {
    return null;
  }

  const outbound = data.outbound;
  const returnJourney = data.return;

  return (
    <article className="scout-flight-card">
      <header className="scout-flight-card-header">
        <div>
          <div className="scout-flight-card-label">
            {data.label || "FLIGHT OPTION"}
          </div>
          <div className="scout-flight-airline">
            {data.airline || "Airline unavailable"}
            {data.flightIdentifier
              ? ` · ${data.flightIdentifier}`
              : ""}
          </div>
        </div>

        {data.fare && (
          <div className="scout-flight-fare">
            {data.fare}
          </div>
        )}
      </header>

      <div className="scout-flight-card-body">
        <Journey journey={outbound} />

        <div className="scout-flight-divider" />

        <Journey journey={returnJourney} />
      </div>

      <footer className="scout-flight-card-footer">
        <div className="scout-flight-passengers">
          {data.travellers || "Travellers unavailable"}
        </div>

        {data.price?.perPersonAmount ? (
          <>
            <div className="scout-flight-price">
              {data.price.perPersonAmount}
              <span className="scout-flight-price-unit">
                / person
              </span>
            </div>
            <div className="scout-flight-total-price">
              {data.price?.amount || "Price unavailable"}
              <span>
                {data.price?.label || "Total trip price"}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="scout-flight-price">
              {data.price?.amount || "Price unavailable"}
            </div>
            <div className="scout-flight-price-label">
              {data.price?.label || "Total trip price"}
            </div>
          </>
        )}

        <button
          type="button"
          className="scout-flight-select"
          data-itinerary-id={data.id || undefined}
          onClick={() => onSelect?.(data)}
        >
          {data.action || "Select flight"}
          <span aria-hidden="true">→</span>
        </button>
      </footer>
    </article>
  );
}
