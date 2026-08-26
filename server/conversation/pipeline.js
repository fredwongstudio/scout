const { interpretConversation } = require("./interpreter");
const { normalizeTripCandidate } = require("../trip/normalize");
const {
  mapTravellerMentionsToPassengers
} = require("../trip/passengers");

const {
  translateTripCandidate
} = require("./translation/trip-context-translator");

async function buildTripCandidate(
  message,
  history = [],
  currentState = null,
  nextAction = null
) {
  const interpreted = await interpretConversation(
    message,
    history
  );

  const translated = translateTripCandidate(
    interpreted,
    currentState,
    nextAction,
    message
  );

  const normalized = normalizeTripCandidate(
    translated
  );

  return {
    origin: normalized.origin,
    destination: normalized.destination,
    departureDate: normalized.departureDate,
    returnDate: normalized.returnDate,
    tripLengthDays: normalized.tripLengthDays,
    tripType: normalized.tripType,
    travellerMentions: normalized.travellerMentions,
    ...(normalized.travellerMentions.length > 0
      ? {
          passengers: mapTravellerMentionsToPassengers(
            normalized.travellerMentions
          )
        }
      : {})
  };
}

module.exports = {
  buildTripCandidate
};
