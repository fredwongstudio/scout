const test = require("node:test");
const assert = require("node:assert/strict");

const {
  DATE_EVIDENCE_SOURCE,
  DATE_POLICY_ISSUE,
  normalizeTripCandidate
} = require("./normalize");
const { initialTripState } = require("./state");
const { applyTripCandidate } = require("./update");
const { createTripManager } = require("./manager");
const { getTripStatus } = require("./validation");

const referenceDate = new Date("2026-09-07T12:00:00");

function dateCandidate(overrides = {}, message = "") {
  return normalizeTripCandidate(
    {
      origin: null,
      destination: null,
      destinationCountry: null,
      departureDate: null,
      returnDate: null,
      tripLengthDays: null,
      tripType: null,
      travellerMentions: [],
      dateProvenance: {
        departureDate: DATE_EVIDENCE_SOURCE.NONE,
        returnDate: DATE_EVIDENCE_SOURCE.NONE
      },
      ...overrides
    },
    referenceDate,
    message
  );
}

test("resolves ambiguous dates to the next occurrence in the rolling horizon", () => {
  assert.equal(
    dateCandidate(
      {
        departureDate: "1 Dec",
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN,
          returnDate: DATE_EVIDENCE_SOURCE.NONE
        }
      },
      "1 Dec"
    ).departureDate,
    "2026-12-01"
  );
  assert.equal(
    dateCandidate(
      {
        departureDate: "10 Jan",
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN,
          returnDate: DATE_EVIDENCE_SOURCE.NONE
        }
      },
      "10 Jan"
    ).departureDate,
    "2027-01-10"
  );
  assert.equal(
    dateCandidate(
      {
        departureDate: "1 Aug",
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN,
          returnDate: DATE_EVIDENCE_SOURCE.NONE
        }
      },
      "1 Aug"
    ).departureDate,
    "2027-08-01"
  );
});

test("duration evidence cannot overwrite a canonical departure with reconstructed history", () => {
  let state = applyTripCandidate(
    initialTripState(),
    dateCandidate(
      {
        departureDate: "1 Dec",
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN,
          returnDate: DATE_EVIDENCE_SOURCE.NONE
        }
      },
      "1 Dec"
    )
  );

  state = applyTripCandidate(
    state,
    dateCandidate(
      {
        departureDate: "2025-12-01",
        tripLengthDays: 7,
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.RECONSTRUCTED,
          returnDate: DATE_EVIDENCE_SOURCE.NONE
        }
      },
      "1 week"
    )
  );

  assert.equal(state.departureDate, "2026-12-01");
  assert.equal(state.returnDate, "2026-12-08");
  assert.equal(state.tripLengthDays, 7);

  state = applyTripCandidate(state, dateCandidate({ origin: "Singapore" }, "Singapore"));
  assert.equal(state.departureDate, "2026-12-01");
  assert.equal(state.returnDate, "2026-12-08");
});

test("duration derives from canonical departure across ordinary and year boundaries", () => {
  let state = applyTripCandidate(
    initialTripState(),
    dateCandidate(
      {
        departureDate: "10 Dec",
        tripLengthDays: 10,
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN,
          returnDate: DATE_EVIDENCE_SOURCE.NONE
        }
      },
      "10 Dec for 10 days"
    )
  );
  assert.equal(state.departureDate, "2026-12-10");
  assert.equal(state.returnDate, "2026-12-20");

  state = applyTripCandidate(
    initialTripState(),
    dateCandidate(
      {
        departureDate: "30 Dec",
        tripLengthDays: 4,
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN,
          returnDate: DATE_EVIDENCE_SOURCE.NONE
        }
      },
      "30 Dec for 4 nights"
    )
  );
  assert.equal(state.departureDate, "2026-12-30");
  assert.equal(state.returnDate, "2027-01-03");
});

test("an explicit departure correction recomputes a derived return date", () => {
  let state = applyTripCandidate(
    initialTripState(),
    dateCandidate(
      {
        departureDate: "1 Dec",
        tripLengthDays: 7,
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN,
          returnDate: DATE_EVIDENCE_SOURCE.NONE
        }
      },
      "1 Dec for a week"
    )
  );

  state = applyTripCandidate(
    state,
    dateCandidate(
      {
        departureDate: "2 Dec",
        tripLengthDays: 7,
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN,
          returnDate: DATE_EVIDENCE_SOURCE.NONE
        }
      },
      "Actually 2 Dec for a week"
    )
  );

  assert.equal(state.departureDate, "2026-12-02");
  assert.equal(state.returnDate, "2026-12-09");
  assert.equal(state.dateSources.returnDate, "DERIVED");
});

test("a date-only correction preserves trip length and recomputes the derived return", () => {
  let state = applyTripCandidate(
    initialTripState(),
    dateCandidate(
      {
        departureDate: "1 Dec",
        tripLengthDays: 7,
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN,
          returnDate: DATE_EVIDENCE_SOURCE.NONE
        }
      },
      "1 Dec for a week"
    )
  );

  state = applyTripCandidate(
    state,
    dateCandidate(
      {
        departureDate: "2 Dec",
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN,
          returnDate: DATE_EVIDENCE_SOURCE.NONE
        }
      },
      "Actually 2 Dec"
    )
  );

  assert.equal(state.departureDate, "2026-12-02");
  assert.equal(state.tripLengthDays, 7);
  assert.equal(state.returnDate, "2026-12-09");
});

test("an explicit return date wins when it is after the canonical departure", () => {
  let state = applyTripCandidate(
    initialTripState(),
    dateCandidate(
      {
        departureDate: "1 Dec",
        tripLengthDays: 7,
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN,
          returnDate: DATE_EVIDENCE_SOURCE.NONE
        }
      },
      "1 Dec for a week"
    )
  );

  state = applyTripCandidate(
    state,
    dateCandidate(
      {
        returnDate: "10 Dec",
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.NONE,
          returnDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN
        }
      },
      "Come back 10 Dec"
    )
  );

  assert.equal(state.returnDate, "2026-12-10");
  assert.equal(state.dateSources.returnDate, "EXPLICIT");
});

test("out-of-horizon and invalid explicit return ranges cannot become searchable state", () => {
  const outsideHorizon = dateCandidate(
    {
      departureDate: "2028-12-01",
      dateProvenance: {
        departureDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN,
        returnDate: DATE_EVIDENCE_SOURCE.NONE
      }
    },
    "1 Dec 2028"
  );
  assert.equal(outsideHorizon.departureDate, null);
  assert.equal(
    outsideHorizon.datePolicyIssues.departureDate,
    DATE_POLICY_ISSUE.OUTSIDE_HORIZON
  );

  const state = applyTripCandidate(
    applyTripCandidate(
      initialTripState(),
      dateCandidate(
        {
          departureDate: "10 Dec",
          dateProvenance: {
            departureDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN,
            returnDate: DATE_EVIDENCE_SOURCE.NONE
          }
        },
        "10 Dec"
      )
    ),
    dateCandidate(
      {
        returnDate: "1 Dec",
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.NONE,
          returnDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN
        }
      },
      "Come back 1 Dec"
    )
  );

  assert.equal(state.returnDate, null);
  assert.equal(
    state.datePolicyIssues.returnDate,
    DATE_POLICY_ISSUE.BEFORE_DEPARTURE
  );
  assert.equal(getTripStatus(state), "INCOMPLETE");
});

test("a fresh trip manager reset discards date state and provenance", () => {
  const trip = createTripManager();
  trip.update(
    dateCandidate(
      {
        departureDate: "1 Dec",
        tripLengthDays: 7,
        dateProvenance: {
          departureDate: DATE_EVIDENCE_SOURCE.CURRENT_TURN,
          returnDate: DATE_EVIDENCE_SOURCE.NONE
        }
      },
      "1 Dec for a week"
    )
  );
  trip.reset();

  assert.deepEqual(trip.get().dateSources, {
    departureDate: null,
    returnDate: null
  });
  assert.deepEqual(trip.get().datePolicyIssues, {
    departureDate: null,
    returnDate: null
  });
  assert.equal(trip.get().departureDate, null);
  assert.equal(trip.get().returnDate, null);
});
