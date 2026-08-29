const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildTripCandidateFromInterpretedEvidence
} = require("./evidence-pipeline");

function evidence(overrides = {}) {
  return {
    origin: null,
    destination: null,
    departureDate: null,
    returnDate: null,
    tripLengthDays: null,
    tripType: null,
    originExplicitlyEstablished: false,
    travellerMentions: [],
    ...overrides
  };
}

test("destination-only evidence cannot promote the same city into origin", () => {
  const candidate = buildTripCandidateFromInterpretedEvidence(
    evidence({
      origin: "Bangkok",
      destination: "Bangkok"
    }),
    null,
    "ASK_DESTINATION",
    "Bangkok"
  );

  assert.equal(candidate.origin, null);
  assert.equal(candidate.destination, "BKK");
});

test("a bare origin answer preserves only the origin", () => {
  const candidate = buildTripCandidateFromInterpretedEvidence(
    evidence({
      origin: "Singapore",
      originExplicitlyEstablished: true
    }),
    null,
    "ASK_ORIGIN",
    "Singapore"
  );

  assert.equal(candidate.origin, "SIN");
  assert.equal(candidate.destination, null);
});

test("an explicit route remains intact in destination context", () => {
  const candidate = buildTripCandidateFromInterpretedEvidence(
    evidence({
      origin: "Singapore",
      destination: "Bangkok",
      originExplicitlyEstablished: true
    }),
    null,
    "ASK_DESTINATION",
    "Singapore to Bangkok"
  );

  assert.equal(candidate.origin, "SIN");
  assert.equal(candidate.destination, "BKK");
});
