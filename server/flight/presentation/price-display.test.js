const assert = require("assert");
const { formatDisplayPrice } = require("../../shared/price-display.cjs");
const { presentFlightCard } = require("./flight-card-presenter");

assert.equal(formatDisplayPrice("USD", 873.53), "US$874");
assert.equal(formatDisplayPrice("USD", 900.39), "US$901");
assert.equal(formatDisplayPrice("USD", 900), "US$900");
assert.equal(formatDisplayPrice("USD", 1747.06), "US$1,748");
assert.equal(formatDisplayPrice("USD", 1800.78), "US$1,801");

const itinerary = {
  id: "exact-price-itinerary",
  currency: "USD",
  outbound: { departure: "202612200930", from: "SIN", to: "NRT", durationMinutes: 405, stops: 0 },
  inbound: { departure: "202612261955", from: "NRT", to: "SIN", durationMinutes: 435, stops: 0 },
  pricing: {
    totalTripPrice: 1747.06,
    travellerCounts: { adults: 2, children: 1, infants: 0 },
  },
};
const card = presentFlightCard(itinerary);

assert.equal(card.price.amount, "US$1,748");
assert.equal(card.price.perPersonAmount, "US$583");
assert.equal(itinerary.pricing.totalTripPrice, 1747.06);

console.log("PASS: display prices round up without changing exact itinerary totals");
