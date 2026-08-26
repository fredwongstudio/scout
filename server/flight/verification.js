const FLIGHT_VERIFICATION_STATUS = Object.freeze({
  SEARCH_RESULT: "SEARCH_RESULT",
  SELECTED: "SELECTED",
  VERIFYING: "VERIFYING",
  VERIFIED: "VERIFIED"
});

function beginVerification(itinerary) {
  if (!itinerary) {
    throw new Error("Selected itinerary is required.");
  }

  if (
    itinerary.status !==
    FLIGHT_VERIFICATION_STATUS.SELECTED
  ) {
    throw new Error(
      "Only a SELECTED itinerary can be verified."
    );
  }

  if (!itinerary.routingIdentifier) {
    throw new Error(
      "Flight routing identifier is required."
    );
  }

  return {
    ...itinerary,
    status:
      FLIGHT_VERIFICATION_STATUS.VERIFYING
  };
}

function markVerified(itinerary, verification) {
  if (!itinerary) {
    throw new Error("Itinerary is required.");
  }

  if (
    itinerary.status !==
    FLIGHT_VERIFICATION_STATUS.VERIFYING
  ) {
    throw new Error(
      "Itinerary must be VERIFYING."
    );
  }

  return {
    ...itinerary,
    status:
      FLIGHT_VERIFICATION_STATUS.VERIFIED,
    verification:
      verification || null
  };
}

module.exports = {
  FLIGHT_VERIFICATION_STATUS,
  beginVerification,
  markVerified
};
