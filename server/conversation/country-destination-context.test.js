const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildTripCandidateFromInterpretedEvidence
} = require("./evidence-pipeline");
const { getNextConversationAction } = require("./decision");
const { formatIncompleteResponse } = require("./response");
const { initialTripState } = require("../trip/state");
const { applyTripCandidate } = require("../trip/update");

function evidence(overrides = {}) {
  return {
    origin: null,
    destination: null,
    destinationCountry: null,
    departureDate: null,
    returnDate: null,
    tripLengthDays: null,
    tripType: null,
    originExplicitlyEstablished: false,
    travellerMentions: [],
    ...overrides
  };
}

function applyEvidence(overrides, message) {
  const candidate = buildTripCandidateFromInterpretedEvidence(
    evidence(overrides),
    initialTripState(),
    "ASK_DESTINATION",
    message
  );

  return applyTripCandidate(initialTripState(), candidate);
}

test("a country-level destination remains unresolved and prompts contextually", () => {
  const state = applyEvidence(
    { destinationCountry: "Thailand" },
    "I want to go Thailand"
  );
  const nextAction = getNextConversationAction(state);

  assert.equal(state.destination, null);
  assert.equal(state.destinationCountry, "Thailand");
  assert.equal(nextAction, "ASK_DESTINATION");
  assert.match(
    formatIncompleteResponse(state, nextAction),
    /Thailand/
  );
});

test("other country-level destinations retain country context without a route code", () => {
  for (const [country, message] of [
    ["Japan", "I want to go Japan"],
    ["Vietnam", "I want to visit Vietnam"]
  ]) {
    const state = applyEvidence({ destinationCountry: country }, message);

    assert.equal(state.destination, null);
    assert.equal(state.destinationCountry, country);
    assert.equal(getNextConversationAction(state), "ASK_DESTINATION");
    assert.match(
      formatIncompleteResponse(state, "ASK_DESTINATION"),
      new RegExp(country)
    );
  }
});

test("a city establishes the canonical destination and clears country context", () => {
  const countryState = applyEvidence(
    { destinationCountry: "Thailand" },
    "I want to go Thailand"
  );
  const candidate = buildTripCandidateFromInterpretedEvidence(
    evidence({ destination: "Phuket" }),
    countryState,
    "ASK_DESTINATION",
    "Phuket"
  );
  const state = applyTripCandidate(countryState, candidate);

  assert.equal(state.destination, "HKT");
  assert.equal(state.destinationCountry, null);
  assert.equal(getNextConversationAction(state), "ASK_DEPARTURE_DATE");
});

test("a later country-level correction replaces earlier unresolved country context", () => {
  const thailand = applyEvidence(
    { destinationCountry: "Thailand" },
    "I want to go Thailand"
  );
  const candidate = buildTripCandidateFromInterpretedEvidence(
    evidence({ destinationCountry: "Japan" }),
    thailand,
    "ASK_DESTINATION",
    "Actually Japan"
  );
  const state = applyTripCandidate(thailand, candidate);

  assert.equal(state.destination, null);
  assert.equal(state.destinationCountry, "Japan");
  assert.equal(getNextConversationAction(state), "ASK_DESTINATION");
});

test("city and explicit-route controls retain canonical destination behavior", () => {
  const bangkok = applyEvidence(
    { destination: "Bangkok" },
    "I want to go Bangkok"
  );
  const route = applyEvidence(
    {
      origin: "Singapore",
      destination: "Bangkok",
      originExplicitlyEstablished: true
    },
    "Singapore to Bangkok"
  );

  assert.equal(bangkok.destination, "BKK");
  assert.equal(getNextConversationAction(bangkok), "ASK_DEPARTURE_DATE");
  assert.equal(route.origin, "SIN");
  assert.equal(route.destination, "BKK");
});
