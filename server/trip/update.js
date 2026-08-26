const { getTripStatus } = require("./validation");

const { applyTripPolicy } = require("./policy");

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function valuesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function applyTripCandidate(currentState, candidate) {
  const nextState = cloneState(currentState);
  let changed = false;

  const fields = [
    "origin",
    "destination",
    "departureDate",
    "returnDate",
    "tripLengthDays",
    "tripType"
  ];

  for (const field of fields) {
    if (
      candidate[field] !== undefined &&
      candidate[field] !== null &&
      !valuesEqual(
        nextState[field],
        candidate[field]
      )
    ) {
      nextState[field] = candidate[field];
      changed = true;
    }
  }

  if (
    candidate.passengers &&
    Array.isArray(candidate.travellerMentions) &&
    candidate.travellerMentions.length > 0
  ) {
    const passengerFields = [
      "adults",
      "children",
      "infants",
      "childAges"
    ];

    for (const field of passengerFields) {
      if (
        candidate.passengers[field] !== undefined &&
        !valuesEqual(
          nextState.passengers[field],
          candidate.passengers[field]
        )
      ) {
        nextState.passengers[field] =
          cloneState(candidate.passengers[field]);

        changed = true;
      }
    }
  }

  const policyState = applyTripPolicy(nextState);

  if (!valuesEqual(nextState, policyState)) {
    Object.assign(nextState, policyState);
    changed = true;
  }

  if (changed) {
    nextState.version += 1;
  }

  nextState.status = getTripStatus(nextState);

  return nextState;
}

module.exports = {
  applyTripCandidate
};
