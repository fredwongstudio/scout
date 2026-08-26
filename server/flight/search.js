const {
  assertFlightSearchAuthorized
} = require("../trip/search-authorization");

const {
  searchAtlasFlights
} = require("./atlas-adapter");

function calculateItineraryTotal(
  itinerary,
  passengers
) {
  const pricing = itinerary.pricing || {};

  const adults =
    pricing.adult
      ? (
          Number(pricing.adult.price || 0) +
          Number(pricing.adult.tax || 0)
        ) * passengers.adults
      : 0;

  const children =
    pricing.child
      ? (
          Number(pricing.child.price || 0) +
          Number(pricing.child.tax || 0)
        ) * passengers.children
      : 0;

  const infants =
    pricing.infant
      ? (
          Number(pricing.infant.price || 0) +
          Number(pricing.infant.tax || 0)
        ) * passengers.infants
      : 0;

  return (
    Math.round(
      (adults + children + infants) * 100
    ) / 100
  );
}

function enrichItinerary(
  itinerary,
  passengers
) {
  return {
    ...itinerary,

    pricing: {
      ...itinerary.pricing,

      travellerCounts: {
        adults: passengers.adults,
        children: passengers.children,
        infants: passengers.infants
      },

      totalTripPrice:
        calculateItineraryTotal(
          itinerary,
          passengers
        )
    }
  };
}

async function searchFlights(tripState) {
  assertFlightSearchAuthorized(tripState);

  const {
    origin,
    destination,
    departureDate,
    returnDate,
    passengers
  } = tripState;

  const itineraries =
    await searchAtlasFlights({
      origin,
      destination,
      depart: departureDate,
      returnDate,
      adults: passengers.adults,
      children: passengers.children,
      infants: passengers.infants,
      currency: "USD"
    });

  return {
    itineraries: itineraries.map(
      (itinerary) =>
        enrichItinerary(
          itinerary,
          passengers
        )
    )
  };
}

module.exports = {
  searchFlights
};
