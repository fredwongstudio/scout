const {
  formatValueTradeoffQuestion
} = require("./value-tradeoff-question");

function formatSearchCompleted(result) {
  const results = result?.results;
  const cards = result?.ui?.find(
    (item) => item?.name === "flight_result"
  )?.data?.cards;
  const itinerary = results?.itineraries?.[0];

  if (!itinerary) {
    return "I couldn't find a usable return flight for those dates.";
  }

  if (Array.isArray(cards) && cards.length > 1) {
    return "Wah, I found 2 return flight options for your trip.";
  }

  const total = itinerary.pricing?.totalTripPrice;
  const currency = itinerary.currency || "USD";

  if (!Number.isFinite(Number(total))) {
    return "I've found a return flight option, but I couldn't get a reliable price yet.";
  }

  return (
    `Wah, I found a return flight option for your trip. ` +
    `The total is ${currency} ${Number(total).toFixed(2)} ` +
    `for everyone travelling.`
  );
}

function formatIncompleteResponse(state, nextAction) {
  const destination = state?.destination;
  const departureDate = state?.departureDate;
  const tripLength = state?.tripLengthDays;
  const origin = state?.origin;

  if (nextAction === "ASK_DESTINATION") {
    return "Where you thinking of going? 😎";
  }

  if (nextAction === "ASK_DEPARTURE_DATE") {
    if (destination === "BKK") {
      return "Wah shiok! Bangkok 😎 When do you wanna go?";
    }

    return "Nice! When do you wanna go?";
  }

  if (nextAction === "ASK_TRIP_LENGTH") {
    if (departureDate) {
      return "Gotcha. How long you thinking?";
    }

    return "How long you thinking?";
  }

  if (nextAction === "ASK_ORIGIN") {
    if (destination === "BKK" && departureDate && tripLength) {
      return `Nice — ${tripLength} days in Bangkok from ${formatDate(
        departureDate
      )}. Where you flying from?`;
    }

    return "Where you flying from?";
  }

  if (nextAction === "ASK_TRIP_TYPE") {
    return "You thinking return or one-way?";
  }

  if (nextAction === "ASK_RETURN_DATE") {
    return "Nice. When you wanna come back?";
  }

  if (nextAction === "ASK_PASSENGERS") {
    return "Who's travelling with you?";
  }

  if (nextAction === "ASK_CHILD_AGES") {
    return "How old are the kids?";
  }

  return "Gotcha 😎 What's next?";
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short"
  });
}

function formatConversationResponse(result) {
  if (!result) {
    throw new Error("Conversation result is required.");
  }

  if (result.action === "SEARCH_COMPLETED") {
    return formatSearchCompleted(result);
  }

  if (result.action === "SEARCH_UNAVAILABLE") {
    return "Sorry, I hit a snag fetching live flights. Let me try again.";
  }

  if (result.action === "REQUEST_VALUE_CHOICE") {
    return formatValueTradeoffQuestion(
      result.valueEngine
    );
  }

  if (result.action === "EVIDENCE_UNAVAILABLE") {
    return "Sorry, I hit a snag understanding that. Could you try saying it again?";
  }

  if (result.action === "CONFIRMATION_UNAVAILABLE") {
    return "Sorry, I hit a snag checking that. Could you try again?";
  }

  if (result.action === "REQUEST_CONFIRMATION") {
    const state = result.state || {};
    const origin = state.origin || "";
    const destination = state.destination || "";
    const departureDate = formatDate(state.departureDate);
    const returnDate = formatDate(state.returnDate);
    const passengers = state.passengers || {};
    const adults = Number(passengers.adults || 0);
    const children = Number(passengers.children || 0);
    const infants = Number(passengers.infants || 0);

    let travellerSummary = "just you 😎";

    if (adults !== 1 || children > 0 || infants > 0) {
      const parts = [];

      if (adults > 0) {
        parts.push(
          `${adults} adult${adults === 1 ? "" : "s"}`
        );
      }

      if (children > 0) {
        parts.push(
          `${children} child${children === 1 ? "" : "ren"}`
        );
      }

      if (infants > 0) {
        parts.push(
          `${infants} infant${infants === 1 ? "" : "s"}`
        );
      }

      travellerSummary =
        parts.length > 0
          ? parts.join(" + ") + " 😎"
          : "travellers 😎";
    }

    if (
      origin &&
      destination &&
      departureDate &&
      returnDate
    ) {
      return (
        `Nice. ${origin} → ${destination}, ` +
        `${departureDate}–${returnDate}, ${travellerSummary} ` +
        `Want me to hunt down some flights?`
      );
    }

    return "Nice 😎 Want me to hunt down some flights?";
  }

  if (result.action === "COLLECT_TRIP_DETAILS") {
    return formatIncompleteResponse(
      result.state,
      result.nextAction
    );
  }

  if (result.action === "COLLECT_CORRECTION") {
    return "Sure — what would you like to change?";
  }

  return "Gotcha 😎";
}

module.exports = {
  formatSearchCompleted,
  formatConversationResponse,
  formatIncompleteResponse
};
