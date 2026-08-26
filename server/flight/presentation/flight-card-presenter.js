const {
  getLocationDisplayName
} = require("../../trip/location-resolver");

function parseAtlasDateTime(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length < 12) return null;

  return {
    year: Number(digits.slice(0, 4)),
    month: Number(digits.slice(4, 6)),
    day: Number(digits.slice(6, 8)),
    hour: digits.slice(8, 10),
    minute: digits.slice(10, 12)
  };
}

function formatDate(value) {
  const parsed = parseAtlasDateTime(value);

  if (!parsed) return value || null;

  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short"
  }).format(
    new Date(
      parsed.year,
      parsed.month - 1,
      parsed.day
    )
  );
}

function formatTime(value) {
  const parsed = parseAtlasDateTime(value);

  if (!parsed) return value || null;

  return `${parsed.hour}:${parsed.minute}`;
}

function formatDuration(minutes) {
  const total = Number(minutes);

  if (!Number.isFinite(total)) return null;

  const hours = Math.floor(total / 60);
  const mins = total % 60;

  return mins
    ? `${hours}h ${mins}m`
    : `${hours}h`;
}

function formatStops(stops) {
  const count = Number(stops || 0);

  if (count === 0) return "Direct";

  return `${count} stop${count === 1 ? "" : "s"}`;
}

function formatTravellers(counts = {}) {
  const parts = [];

  const adults = Number(counts.adults || 0);
  const children = Number(counts.children || 0);
  const infants = Number(counts.infants || 0);

  if (adults) {
    parts.push(`${adults} adult${adults === 1 ? "" : "s"}`);
  }

  if (children) {
    parts.push(`${children} child${children === 1 ? "" : "ren"}`);
  }

  if (infants) {
    parts.push(`${infants} infant${infants === 1 ? "" : "s"}`);
  }

  return parts.join(" · ");
}

function formatPrice(currency, value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return null;

  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: currency || "USD"
  }).format(amount);
}

function formatTripDate(value) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function presentFlightResultSummary(state = {}) {
  const route =
    state.origin && state.destination
      ? `${getLocationDisplayName(state.origin)} → ${getLocationDisplayName(
          state.destination
        )}`
      : null;
  const departureDate = formatTripDate(state.departureDate);
  const returnDate = formatTripDate(state.returnDate);

  return {
    route,
    dates:
      departureDate && returnDate
        ? `${departureDate} → ${returnDate}`
        : departureDate || returnDate || null,
    travellers: formatTravellers(state.passengers)
  };
}

function presentJourney(journey, label) {
  if (!journey) return null;

  const date = formatDate(journey.departure);

  return {
    label: date
      ? `${label} · ${date}`
      : label,

    departureTime:
      formatTime(journey.departure),

    departureAirport:
      journey.from || null,

    arrivalTime:
      formatTime(journey.arrival),

    arrivalAirport:
      journey.to || null,

    duration:
      formatDuration(journey.durationMinutes),

    stops:
      formatStops(journey.stops)
  };
}

function presentFlightCard(itinerary, options = {}) {
  if (!itinerary) return null;

  const travellerCounts =
    itinerary.pricing?.travellerCounts || {};

  const totalPrice =
    itinerary.pricing?.totalTripPrice;
  const travellerCount = [
    travellerCounts.adults,
    travellerCounts.children,
    travellerCounts.infants
  ].reduce((total, count) => total + Number(count || 0), 0);
  const perPersonPrice =
    travellerCount > 0 && Number.isFinite(Number(totalPrice))
      ? Number(totalPrice) / travellerCount
      : null;

  return {
    id:
      itinerary.id ||
      itinerary.routingIdentifier ||
      null,

    label: options.label || null,

    airline:
      itinerary.airline || null,

    airlineCode:
      itinerary.airlineCode ||
      itinerary.airline ||
      null,

    airlineName:
      itinerary.airlineName || null,

    fare:
      itinerary.fare ||
      itinerary.cabin ||
      null,

    flightIdentifier:
      itinerary.outbound?.segments?.[0]?.flightNumber ||
      null,

    outbound:
      presentJourney(
        itinerary.outbound,
        "OUTBOUND"
      ),

    return:
      presentJourney(
        itinerary.inbound,
        "RETURN"
      ),

    travellers:
      formatTravellers(travellerCounts),

    price: {
      amount:
        formatPrice(
          itinerary.currency,
          totalPrice
        ),
      perPersonAmount:
        perPersonPrice == null
          ? null
          : formatPrice(
              itinerary.currency,
              perPersonPrice
            ),
      label:
        "Total trip price"
    },

    action:
      "Select flight"
  };
}

module.exports = {
  presentFlightCard,
  presentFlightResultSummary
};
