const {
  extractFlightPreferenceEvidence
} = require("./flight-preference-evidence");

function emptyTurnUnderstanding() {
  return {
    tripEvidence: null,
    preferenceEvidence: null,
    confirmationIntent: null,
    correctionIntent: false,
    childAge: null,
    valueChoiceIntent: null,
    deterministicSignals: []
  };
}

function hasPreferenceEvidence(preferenceEvidence) {
  return Object.values(preferenceEvidence || {}).some(
    (value) => value != null
  );
}

function hasLeadingAffirmative(message) {
  const value = String(message || "")
    .trim()
    .toLowerCase();

  return /^(?:yes|yeah|yep|sure)\b|^go\s+ahead\b/.test(
    value
  );
}

function hasCorrectionMarker(message) {
  return /\b(?:actually|instead|change)\b|\bmake\s+it\b/i.test(
    String(message || "")
  );
}

function getBarePlausibleChildAge(message) {
  const value = String(message || "").trim();

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const age = Number(value);

  return Number.isInteger(age) && age >= 0 && age <= 17
    ? age
    : null;
}

function interpretConversationTurn({
  message,
  currentAction
} = {}) {
  const understanding = emptyTurnUnderstanding();

  if (currentAction === "READY_FOR_CONFIRMATION") {
    const preferenceEvidence =
      extractFlightPreferenceEvidence(message);
    const correctionIntent = hasCorrectionMarker(message);
    const confirmationIntent =
      !correctionIntent && hasLeadingAffirmative(message)
        ? "CONFIRM"
        : null;

    return {
      ...understanding,
      preferenceEvidence,
      confirmationIntent,
      correctionIntent,
      deterministicSignals: [
        ...(confirmationIntent ? ["confirmation"] : []),
        ...(hasPreferenceEvidence(preferenceEvidence)
          ? ["flight_preference"]
          : [])
      ]
    };
  }

  if (currentAction !== "ASK_CHILD_AGES") {
    return understanding;
  }

  const childAge = getBarePlausibleChildAge(message);

  if (childAge == null) {
    return understanding;
  }

  return {
    ...understanding,
    tripEvidence: {
      origin: null,
      destination: null,
      departureDate: null,
      returnDate: null,
      tripLengthDays: null,
      tripType: null,
      travellerMentions: [
        {
          relation: "child",
          category: "child",
          age: childAge
        }
      ]
    },
    childAge,
    deterministicSignals: ["child_age"]
  };
}

module.exports = {
  emptyTurnUnderstanding,
  getBarePlausibleChildAge,
  hasCorrectionMarker,
  hasLeadingAffirmative,
  hasPreferenceEvidence,
  interpretConversationTurn
};
