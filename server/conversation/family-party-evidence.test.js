const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildTripCandidateFromInterpretedEvidence
} = require("./evidence-pipeline");
const { applyTripCandidate } = require("../trip/update");
const { initialTripState } = require("../trip/state");

function evidence(travellerMentions) {
  return {
    origin: null,
    destination: null,
    departureDate: null,
    returnDate: null,
    tripLengthDays: null,
    tripType: null,
    travellerMentions
  };
}

function traveller(relation, category, age = null) {
  return { relation, category, age };
}

function passengersFrom(travellerMentions) {
  return buildTripCandidateFromInterpretedEvidence(
    evidence(travellerMentions)
  ).passengers;
}

test("family evidence preserves the traveller explicitly included with plural parents", () => {
  assert.deepEqual(
    passengersFrom([
      traveller("self", "adult"),
      traveller("parent", "adult"),
      traveller("parent", "adult")
    ]),
    { adults: 3, children: 0, infants: 0, childAges: [] }
  );
});

test("parents travelling without the speaker remain two adults", () => {
  assert.deepEqual(
    passengersFrom([
      traveller("parent", "adult"),
      traveller("parent", "adult")
    ]),
    { adults: 2, children: 0, infants: 0, childAges: [] }
  );
});

test("one parent travelling with the speaker is two adults", () => {
  assert.deepEqual(
    passengersFrom([
      traveller("self", "adult"),
      traveller("parent", "adult")
    ]),
    { adults: 2, children: 0, infants: 0, childAges: [] }
  );
});

test("parents and a son do not implicitly add the speaker", () => {
  assert.deepEqual(
    passengersFrom([
      traveller("parent", "adult"),
      traveller("parent", "adult"),
      traveller("son", "child")
    ]),
    { adults: 2, children: 1, infants: 0, childAges: [] }
  );
});

test("vague family language does not create passengers", () => {
  const candidate = buildTripCandidateFromInterpretedEvidence(
    evidence([])
  );

  assert.deepEqual(candidate.travellerMentions, []);
  assert.equal(candidate.passengers, undefined);
});

test("new explicit traveller evidence replaces an earlier inferred party in trip state", () => {
  const priorCandidate = buildTripCandidateFromInterpretedEvidence(
    evidence([
      traveller("self", "adult"),
      traveller("parent", "adult"),
      traveller("parent", "adult")
    ])
  );
  const correctedCandidate = buildTripCandidateFromInterpretedEvidence(
    evidence([
      traveller("self", "adult"),
      traveller("father", "adult")
    ])
  );

  const priorState = applyTripCandidate(
    initialTripState(),
    priorCandidate
  );
  const correctedState = applyTripCandidate(
    priorState,
    correctedCandidate
  );

  assert.deepEqual(correctedState.passengers, {
    adults: 2,
    children: 0,
    infants: 0,
    childAges: []
  });
});
