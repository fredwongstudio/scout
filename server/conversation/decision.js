function getNextConversationAction(state, conversationContext = {}) {
  if (!state?.destination) {
    return "ASK_DESTINATION";
  }

  if (!state?.departureDate) {
    return "ASK_DEPARTURE_DATE";
  }

  if (!state?.tripLengthDays && !state?.returnDate) {
    return "ASK_TRIP_LENGTH";
  }

  if (!state?.origin) {
    return "ASK_ORIGIN";
  }

  if (!state?.tripType) {
    return "ASK_TRIP_TYPE";
  }

  if (
    state.tripType === "ROUND_TRIP" &&
    !state.returnDate
  ) {
    return "ASK_RETURN_DATE";
  }

  if (!conversationContext.travellersEstablished) {
    return "ASK_PASSENGERS";
  }

  const passengers = state.passengers || {};
  const totalPassengers =
    Number(passengers.adults || 0) +
    Number(passengers.children || 0) +
    Number(passengers.infants || 0);

  if (totalPassengers <= 0) {
    return "ASK_PASSENGERS";
  }

  if (
    Number(passengers.children || 0) > 0 &&
    (!Array.isArray(passengers.childAges) ||
      passengers.childAges.length !== Number(passengers.children))
  ) {
    return "ASK_CHILD_AGES";
  }

  return "REQUEST_CONFIRMATION";
}

module.exports = {
  getNextConversationAction
};
