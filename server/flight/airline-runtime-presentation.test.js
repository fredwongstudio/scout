const assert = require("assert");
const {
  normalizeRoundTripFlights
} = require("./round-trip-normalizer");
const {
  presentFlightCard
} = require("./presentation/flight-card-presenter");

const [normalized] = normalizeRoundTripFlights({
  routings: [{
    fid: "tr-live-shaped",
    currency: "USD",
    adultPrice: 100,
    adultTax: 20,
    fromSegments: [{
      carrier: "TR",
      flightNumber: "TR874",
      depAirport: "SIN",
      arrAirport: "NRT",
      depTime: "202612200930",
      arrTime: "202612201715",
      duration: 405
    }],
    retSegments: [{
      carrier: "TR",
      flightNumber: "TR882",
      depAirport: "NRT",
      arrAirport: "SIN",
      depTime: "202612261955",
      arrTime: "202612270210",
      duration: 435
    }]
  }]
});

normalized.pricing.travellerCounts = { adults: 1, children: 0, infants: 0 };
normalized.pricing.totalTripPrice = 120;

const card = presentFlightCard(normalized);

assert.deepStrictEqual(
  {
    airline: card.airline,
    airlineCode: card.airlineCode,
    airlineName: card.airlineName,
    flightIdentifier: card.flightIdentifier
  },
  {
    airline: "TR",
    airlineCode: "TR",
    airlineName: "Scoot",
    flightIdentifier: "TR874"
  }
);

console.log("PASS: active deployed search path preserves Scoot metadata to card data");
