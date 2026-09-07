const { getTripStatus } = require("./validation");

const { applyTripPolicy } = require("./policy");
const {
  DATE_EVIDENCE_SOURCE,
  DATE_POLICY_ISSUE
} = require("./normalize");

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function valuesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function applyTripCandidate(currentState, candidate) {
  const nextState = cloneState(currentState);
  let changed = false;

  if (!nextState.dateSources) {
    nextState.dateSources = {
      departureDate: null,
      returnDate: null
    };
  }

  if (!nextState.datePolicyIssues) {
    nextState.datePolicyIssues = {
      departureDate: null,
      returnDate: null
    };
  }

  let departureChanged = false;
  let tripLengthChanged = false;
  let explicitReturnDate = false;

  for (const field of ["departureDate", "returnDate"]) {
    const source = candidate.dateProvenance?.[field];
    const issue = candidate.datePolicyIssues?.[field] || null;

    if (source !== DATE_EVIDENCE_SOURCE.CURRENT_TURN) {
      continue;
    }

    if (issue) {
      if (nextState.datePolicyIssues[field] !== issue) {
        nextState.datePolicyIssues[field] = issue;
        changed = true;
      }
      continue;
    }

    if (candidate[field] == null) {
      continue;
    }

    if (!valuesEqual(nextState[field], candidate[field])) {
      nextState[field] = candidate[field];
      changed = true;
      departureChanged ||= field === "departureDate";
    }

    if (nextState.dateSources[field] !== "EXPLICIT") {
      nextState.dateSources[field] = "EXPLICIT";
      changed = true;
    }

    if (nextState.datePolicyIssues[field] !== null) {
      nextState.datePolicyIssues[field] = null;
      changed = true;
    }

    explicitReturnDate ||= field === "returnDate";
  }

  const fields = [
    "origin",
    "destination",
    "destinationCountry",
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
      tripLengthChanged ||= field === "tripLengthDays";
    }
  }

  if (
    (departureChanged || tripLengthChanged) &&
    !explicitReturnDate &&
    nextState.dateSources.returnDate !== "EXPLICIT"
  ) {
    if (nextState.returnDate !== null) {
      nextState.returnDate = null;
      changed = true;
    }

    if (nextState.dateSources.returnDate !== null) {
      nextState.dateSources.returnDate = null;
      changed = true;
    }
  }

  if (
    candidate.destination &&
    nextState.destinationCountry !== null
  ) {
    nextState.destinationCountry = null;
    changed = true;
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

  if (
    nextState.departureDate &&
    nextState.returnDate &&
    nextState.returnDate < nextState.departureDate
  ) {
    nextState.returnDate = null;
    nextState.dateSources.returnDate = null;
    nextState.datePolicyIssues.returnDate =
      DATE_POLICY_ISSUE.BEFORE_DEPARTURE;
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
