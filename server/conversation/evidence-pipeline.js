const {
  interpretConversationEvidence
} = require("./evidence-interpreter");

const {
  evidenceToCandidate
} = require("./evidence-to-candidate");

const {
  translateTripCandidate
} = require("./translation/trip-context-translator");

const {
  normalizeTripCandidate
} = require("../trip/normalize");

const {
  mapTravellerMentionsToPassengers
} = require("../trip/passengers");

const {
  extractFlightPreferenceEvidence
} = require("./flight-preference-evidence");

function buildTripCandidateFromInterpretedEvidence(
  evidence,
  currentState = null,
  nextAction = null,
  message = "",
  preferenceEvidence = null
) {
  const candidate =
    evidenceToCandidate(evidence);

  const translated =
    translateTripCandidate(
      candidate,
      currentState,
      nextAction,
      message
    );

  let normalized =
    normalizeTripCandidate(translated);

  if (
    nextAction === "ASK_DESTINATION" &&
    normalized.destination &&
    normalized.origin === normalized.destination &&
    translated.originExplicitlyEstablished !== true
  ) {
    normalized = {
      ...normalized,
      origin: null
    };
  }

  const passengers =
    normalized.travellerMentions.length > 0
      ? mapTravellerMentionsToPassengers(
          normalized.travellerMentions
        )
      : null;

  return {
    origin: normalized.origin,
    destination: normalized.destination,
    destinationCountry: normalized.destinationCountry,
    departureDate: normalized.departureDate,
    returnDate: normalized.returnDate,
    tripLengthDays: normalized.tripLengthDays,
    tripType: normalized.tripType,
    travellerMentions:
      normalized.travellerMentions,
    ...(passengers
      ? {
          passengers:
            nextAction === "ASK_CHILD_AGES"
              ? {
                  ...(currentState?.passengers || {}),
                  childAges: passengers.childAges
                }
              : passengers
        }
      : {}),
    preferenceEvidence
  };
}

async function buildTripCandidateFromEvidence(
  message,
  history = [],
  currentState = null,
  nextAction = null
) {
  const evidence =
    await interpretConversationEvidence(
      message,
      history
    );

  const preferenceEvidence =
    extractFlightPreferenceEvidence(message);

  return buildTripCandidateFromInterpretedEvidence(
    evidence,
    currentState,
    nextAction,
    message,
    preferenceEvidence
  );
}

module.exports = {
  buildTripCandidateFromEvidence,
  buildTripCandidateFromInterpretedEvidence
};
