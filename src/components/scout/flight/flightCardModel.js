const formatDuration = (minutes) => {
  const total = Number(minutes);

  if (!Number.isFinite(total)) {
    return null;
  }

  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
};

const formatDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
  }).format(date);
};

const formatTime = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

const formatPrice = (currency, value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
};

const mapSegment = (segment) => ({
  flightNumber: segment?.flightNumber || null,
  airlineCode: segment?.airlineCode || segment?.carrier || null,
  airlineName: segment?.airlineName || null,
  from: segment?.depAirport || null,
  to: segment?.arrAirport || null,
  departure: formatTime(segment?.depTime),
  arrival: formatTime(segment?.arrTime),
  duration: formatDuration(segment?.duration),
});

const mapJourney = (journey) => ({
  from: journey?.from || null,
  to: journey?.to || null,
  departure: formatTime(journey?.departure),
  arrival: formatTime(journey?.arrival),
  date: formatDate(journey?.departure),
  duration: formatDuration(journey?.durationMinutes),
  stops: Number(journey?.stops || 0),
  segments: Array.isArray(journey?.segments)
    ? journey.segments.map(mapSegment)
    : [],
});

export function toFlightCardModel(itinerary) {
  if (!itinerary) {
    return null;
  }

  const travellerCounts =
    itinerary.pricing?.travellerCounts || {};

  const totalPrice =
    itinerary.pricing?.totalTripPrice;

  return {
    id: itinerary.id || null,

    // `airline` is retained as the legacy code-only compatibility field.
    airline: itinerary.airline || null,
    airlineCode: itinerary.airlineCode || itinerary.airline || null,
    airlineName: itinerary.airlineName || null,

    currency: itinerary.currency || "USD",

    outbound: mapJourney(itinerary.outbound),

    inbound: mapJourney(itinerary.inbound),

    passengers: {
      adults: Number(travellerCounts.adults || 0),
      children: Number(travellerCounts.children || 0),
      infants: Number(travellerCounts.infants || 0),
    },

    price: {
      amount: Number.isFinite(Number(totalPrice))
        ? Number(totalPrice)
        : null,
      formatted: formatPrice(
        itinerary.currency,
        totalPrice
      ),
    },

    baggage: Array.isArray(itinerary.baggage)
      ? itinerary.baggage
      : [],

    routingIdentifier:
      itinerary.routingIdentifier || null,
  };
}
