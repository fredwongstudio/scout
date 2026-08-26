const FLIGHT_SELECTION_STATUS = Object.freeze({
  SEARCH_RESULT: "SEARCH_RESULT",
  SELECTED: "SELECTED"
});

function selectItinerary(itinerary) {
  if (!itinerary) {
    throw new Error("Flight itinerary is required.");
  }

  if (!itinerary.id) {
    throw new Error(
      "Flight itinerary ID is required."
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
      FLIGHT_SELECTION_STATUS.SELECTED
  };
}

module.exports = {
  FLIGHT_SELECTION_STATUS,
  selectItinerary
};
