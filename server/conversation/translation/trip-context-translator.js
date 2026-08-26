const selfEquivalentRelations = new Set([
  "self",
  "user",
  "me",
  "i"
]);

function isSelfEquivalentTraveller(traveller) {
  return selfEquivalentRelations.has(
    String(traveller?.relation || "")
      .trim()
      .toLowerCase()
  );
}

function getDirectChildAge(message) {
  const value = String(message || "").trim();

  if (!/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

function translateTripCandidate(
  interpreted,
  currentState,
  nextAction,
  message
) {
  const candidate = {
    ...interpreted
  };

  if (
    nextAction === "ASK_ORIGIN" &&
    currentState?.destination &&
    message?.trim()
  ) {
    candidate.origin = candidate.origin?.trim() || message.trim();
    candidate.destination = currentState.destination;
  }

  if (
    nextAction === "ASK_PASSENGERS" &&
    currentState
  ) {
    candidate.origin = currentState.origin;
    candidate.destination = currentState.destination;
    candidate.departureDate = currentState.departureDate;
    candidate.returnDate = currentState.returnDate;
    candidate.tripLengthDays = currentState.tripLengthDays;
    candidate.tripType = currentState.tripType;

    if (
      Array.isArray(candidate.travellerMentions) &&
      candidate.travellerMentions.length > 0 &&
      !candidate.travellerMentions.some(
        isSelfEquivalentTraveller
      )
    ) {
      candidate.travellerMentions = [
        {
          relation: "self",
          category: "adult",
          age: null
        },
        ...candidate.travellerMentions
      ];
    }
  }

  if (
    nextAction === "ASK_CHILD_AGES" &&
    currentState
  ) {
    candidate.origin = currentState.origin;
    candidate.destination = currentState.destination;
    candidate.departureDate = currentState.departureDate;
    candidate.returnDate = currentState.returnDate;
    candidate.tripLengthDays = currentState.tripLengthDays;
    candidate.tripType = currentState.tripType;

    const directChildAge = getDirectChildAge(message);
    const travellerMentions = Array.isArray(
      candidate.travellerMentions
    )
      ? candidate.travellerMentions
      : [];
    const childWithKnownAgeIndex =
      travellerMentions.findIndex(
        (traveller) =>
          traveller.category === "child" &&
          traveller.age != null &&
          Number.isFinite(Number(traveller.age))
      );

    if (
      directChildAge != null &&
      childWithKnownAgeIndex === -1
    ) {
      const childIndex = travellerMentions.findIndex(
        (traveller) => traveller.category === "child"
      );

      if (childIndex >= 0) {
        candidate.travellerMentions =
          travellerMentions.map(
            (traveller, index) =>
              index === childIndex
                ? {
                    ...traveller,
                    age: directChildAge
                  }
                : traveller
          );
      } else {
        candidate.travellerMentions = [
          ...travellerMentions,
          {
            relation: "child",
            category: "child",
            age: directChildAge
          }
        ];
      }
    }
  }

  return candidate;
}

module.exports = {
  getDirectChildAge,
  isSelfEquivalentTraveller,
  translateTripCandidate
};
