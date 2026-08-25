export default function BookingJourney({ journey, fallbackLabel = "FLIGHT" }) {
  if (!journey) return null;

  return (
    <section className="scout-booking-journey">
      <div className="scout-booking-journey-label">
        {journey.label || fallbackLabel}
      </div>
      <div className="scout-booking-route">
        <div className="scout-booking-time">
          {journey.departureTime || "--:--"}
          <span>{journey.departureAirport || "—"}</span>
        </div>
        <div className="scout-booking-route-centre" aria-hidden="true">
          <div className="scout-booking-duration">
            {journey.duration || "Duration unavailable"}
          </div>
          <div className="scout-booking-line" />
          <div className={journey.stops === "Direct" ? "scout-booking-stops scout-booking-direct" : "scout-booking-stops"}>
            {journey.stops || "Stops unavailable"}
          </div>
        </div>
        <div className="scout-booking-time scout-booking-time-right">
          {journey.arrivalTime || "--:--"}
          <span>{journey.arrivalAirport || "—"}</span>
        </div>
      </div>
    </section>
  );
}
