const { createTripManager } = require("../trip/manager");

const {
  buildTripCandidate
} = require("./pipeline");

const {
  buildTripCandidateFromEvidence,
  buildTripCandidateFromInterpretedEvidence
} = require("./evidence-pipeline");

const {
  interpretConversationTurn
} = require("./conversation-turn-interpreter");

const {
  interpretConfirmation
} = require("./confirmation-interpreter");

const {
  searchFlights
} = require("../flight/search");

const {
  getNextConversationAction
} = require("./decision");

const {
  presentFlightCard,
  presentFlightResultSummary
} = require("../flight/presentation/flight-card-presenter");

const {
  selectFlightValue
} = require("../value-engine/value-engine");

const {
  VALUE_CHOICE,
  interpretValueChoice
} = require("./value-choice-interpreter");

const {
  formatConversationResponse
} = require("./response");

function initialFlightPreferences() {
  return {
    outboundTiming: "FLEXIBLE",
    returnTiming: "FLEXIBLE",
    stopsPreference: "FLEXIBLE",
    valueTradeoff: "PRICE_FIRST"
  };
}

function createConversationOrchestrator() {
  const trip = createTripManager();

  const history = [];
  const conversationContext = {
    travellersEstablished: false,
    collectingCorrection: false,
    flightPreferences: initialFlightPreferences(),
    pendingValueChoice: null
  };

  async function executeSearch(state) {
    return searchFlights(state);
  }

  function buildFlightSearchRecoveryUi() {
    return [
      {
        type: "data",
        name: "flight_search_recovery",
        data: {}
      }
    ];
  }

  function buildSearchUnavailableResult(state) {
    return {
      action: "SEARCH_UNAVAILABLE",
      state,
      ui: buildFlightSearchRecoveryUi()
    };
  }

  function applyPreferenceEvidence(preferenceEvidence) {
    if (!preferenceEvidence) {
      return;
    }

    for (const field of [
      "outboundTiming",
      "returnTiming",
      "stopsPreference",
      "valueTradeoff"
    ]) {
      if (preferenceEvidence[field] != null) {
        conversationContext.flightPreferences[field] =
          preferenceEvidence[field];
      }
    }
  }

  function hasPreferenceEvidence(preferenceEvidence) {
    return Object.values(preferenceEvidence || {}).some(
      (value) => value != null
    );
  }

  function buildSearchCompletedResult(
    state,
    results,
    valueEngine
  ) {
    const recommendedItinerary =
      valueEngine.recommendedItinerary;
    const directItineraries =
      selectCheapestDirectItineraries(
        results?.itineraries
      );
    const displayedResults =
      recommendedItinerary
        ? {
            ...results,
            itineraries: [recommendedItinerary]
          }
        : results;
    const cards = directItineraries.length > 0
      ? directItineraries.map((itinerary, index) =>
          presentFlightCard(itinerary, {
            label:
              index === 0
                ? "SCOUT'S PICK"
                : "BEST ALTERNATIVE"
          })
        )
      : recommendedItinerary
        ? [
            presentFlightCard(recommendedItinerary, {
            label: "SCOUT'S PICK"
            })
          ]
        : [];
    const alternativeItinerary =
      directItineraries.length === 0
        ? selectBestAlternativeItinerary(
            results?.itineraries,
            valueEngine,
            recommendedItinerary
          )
        : null;

    if (alternativeItinerary) {
      cards.push(
        presentFlightCard(alternativeItinerary, {
          label: "BEST ALTERNATIVE"
        })
      );
    }

    return {
      action: "SEARCH_COMPLETED",
      state,
      results: displayedResults,
      valueEngine,
      ui: !results?.itineraries?.[0]
        ? buildFlightSearchRecoveryUi()
        : cards.length > 0
        ? [
            {
              type: "data",
              name: "flight_result",
              data: {
                summary:
                  presentFlightResultSummary(state),
                cards
              }
            }
          ]
        : []
    };
  }

  function isPresentableItinerary(itinerary) {
    return Boolean(
      itinerary &&
      itinerary.outbound &&
      itinerary.inbound &&
      Number.isFinite(
        Number(itinerary.pricing?.totalTripPrice)
      )
    );
  }

  function isSameItinerary(first, second) {
    if (!first || !second) {
      return false;
    }

    if (first.id && second.id) {
      return first.id === second.id;
    }

    if (
      first.routingIdentifier &&
      second.routingIdentifier
    ) {
      return (
        first.routingIdentifier ===
        second.routingIdentifier
      );
    }

    return first === second;
  }

  function isMeaningfullyDifferent(first, second) {
    if (!first || !second) {
      return false;
    }

    return (
      Number(first.pricing?.totalTripPrice) !==
        Number(second.pricing?.totalTripPrice) ||
      Number(first.outbound?.stops || 0) !==
        Number(second.outbound?.stops || 0) ||
      Number(first.inbound?.stops || 0) !==
        Number(second.inbound?.stops || 0) ||
      first.outbound?.departure !==
        second.outbound?.departure ||
      first.inbound?.departure !==
        second.inbound?.departure
    );
  }

  function hasStopsContrast(first, second) {
    return (
      Number(first?.outbound?.stops || 0) !==
        Number(second?.outbound?.stops || 0) ||
      Number(first?.inbound?.stops || 0) !==
        Number(second?.inbound?.stops || 0)
    );
  }

  function searchResultMatch(itineraries, target) {
    return itineraries.find((itinerary) =>
      isSameItinerary(itinerary, target)
    ) || null;
  }

  function selectBestAlternativeItinerary(
    itineraries,
    valueEngine,
    recommendedItinerary
  ) {
    const available = Array.isArray(itineraries)
      ? itineraries.filter(isPresentableItinerary)
      : [];
    const isUsefulAlternative = (itinerary) =>
      itinerary &&
      !isSameItinerary(itinerary, recommendedItinerary) &&
      isMeaningfullyDifferent(
        itinerary,
        recommendedItinerary
      );
    const fromValueEngine = [
      valueEngine?.tradeoff?.alternativeItinerary,
      ...(Array.isArray(valueEngine?.candidates)
        ? valueEngine.candidates.map(
            (candidate) => candidate?.itinerary
          )
        : [])
    ]
      .map((itinerary) =>
        searchResultMatch(available, itinerary)
      )
      .find(isUsefulAlternative);

    if (fromValueEngine) {
      return fromValueEngine;
    }

    const cheapest = searchResultMatch(
      available,
      valueEngine?.cheapestItinerary
    );

    if (isUsefulAlternative(cheapest)) {
      return cheapest;
    }

    const contrasting = available
      .filter(isUsefulAlternative)
      .filter((itinerary) =>
        hasStopsContrast(itinerary, recommendedItinerary)
      )
      .sort(
        (first, second) =>
          Number(first.pricing.totalTripPrice) -
          Number(second.pricing.totalTripPrice)
      )[0];

    if (contrasting) {
      return contrasting;
    }

    return available.find(
      (itinerary) =>
        !isSameItinerary(itinerary, recommendedItinerary)
    ) || null;
  }

  function selectCheapestDirectItineraries(itineraries) {
    const candidates = (Array.isArray(itineraries)
      ? itineraries
      : []
    )
      .map((itinerary, index) => ({ itinerary, index }))
      .filter(
        ({ itinerary }) =>
          isDirectRoundTrip(itinerary)
      )
      .sort(
        (first, second) =>
          Number(
            first.itinerary.pricing.totalTripPrice
          ) -
            Number(
              second.itinerary.pricing.totalTripPrice
            ) ||
          first.index - second.index
      );
    const selected = [];

    for (const { itinerary } of candidates) {
      if (
        selected.some((existing) =>
          isSameItinerary(existing, itinerary)
        )
      ) {
        continue;
      }

      selected.push(itinerary);

      if (selected.length === 2) {
        break;
      }
    }

    return selected;
  }

  function isDirectRoundTrip(itinerary) {
    return Boolean(
      isPresentableItinerary(itinerary) &&
      itinerary.outbound.stops === 0 &&
      itinerary.inbound.stops === 0
    );
  }

  function evaluateSearchResults(state, results) {
    const valueEngine = selectFlightValue(
      results.itineraries,
      conversationContext.flightPreferences
    );

    if (
      valueEngine.recommendationStatus ===
      "NEEDS_USER_CHOICE"
    ) {
      conversationContext.pendingValueChoice = {
        results,
        valueEngine
      };

      return {
        action: "REQUEST_VALUE_CHOICE",
        state,
        valueEngine,
        ui: []
      };
    }

    return buildSearchCompletedResult(
      state,
      results,
      valueEngine
    );
  }

  async function confirmAndSearch(message) {
    const confirmedState = trip.confirm();

    let results;

    try {
      results = await executeSearch(confirmedState);
    } catch (error) {
      const result = buildSearchUnavailableResult(confirmedState);

      recordTurn(message, result);

      return result;
    }

    const result = evaluateSearchResults(
      confirmedState,
      results
    );

    recordTurn(message, result);

    return result;
  }

  function startsTripCorrection(message) {
    return /^(actually|change|correct|make it|instead)\b/i.test(
      String(message || "").trim()
    );
  }

  function hasUsableCorrection(candidate) {
    const fields = [
      "origin",
      "destination",
      "departureDate",
      "returnDate",
      "tripLengthDays",
      "tripType"
    ];

    return (
      fields.some(
        (field) =>
          candidate[field] !== undefined &&
          candidate[field] !== null
      ) ||
      (Array.isArray(candidate.travellerMentions) &&
        candidate.travellerMentions.length > 0)
    );
  }

  function recordTurn(message, result) {
    const reply = formatConversationResponse(result);

    history.push(
      {
        role: "user",
        content: message
      },
      {
        role: "assistant",
        content: reply
      }
    );
  }

  function recoverFromEvidenceFailure(
    message,
    currentState
  ) {
    const result = {
      action: "EVIDENCE_UNAVAILABLE",
      state: currentState
    };

    recordTurn(message, result);

    return result;
  }

  async function handleCorrectionMessage(
    message,
    currentState
  ) {
    let candidate;

    try {
      candidate =
        await buildTripCandidateFromEvidence(
          message,
          history,
          currentState,
          "REQUEST_CONFIRMATION"
      );
    } catch (error) {
      return recoverFromEvidenceFailure(
        message,
        currentState
      );
    }

    applyPreferenceEvidence(
      candidate.preferenceEvidence
    );

    if (!hasUsableCorrection(candidate)) {
      conversationContext.collectingCorrection = true;

      const result = {
        action: "COLLECT_CORRECTION",
        state: currentState
      };

      recordTurn(message, result);

      return result;
    }

    if (
      Array.isArray(candidate.travellerMentions) &&
      candidate.travellerMentions.length > 0
    ) {
      conversationContext.travellersEstablished = true;
    }

    const nextState =
      trip.update(candidate);
    const nextAction =
      getNextConversationAction(
        nextState,
        conversationContext
      );

    conversationContext.collectingCorrection = false;

    const result =
      nextState.status === "READY_FOR_CONFIRMATION"
        ? {
            action: "REQUEST_CONFIRMATION",
            nextAction: "REQUEST_CONFIRMATION",
            state: nextState
          }
        : {
            action: "COLLECT_TRIP_DETAILS",
            nextAction,
            state: nextState
          };

    recordTurn(message, result);

    return result;
  }

  async function handleValueChoiceMessage(
    message,
    currentState
  ) {
    if (startsTripCorrection(message)) {
      conversationContext.pendingValueChoice = null;

      return handleCorrectionMessage(
        message,
        currentState
      );
    }

    const choice = interpretValueChoice(message);
    const pending = conversationContext.pendingValueChoice;

    if (choice.choice === VALUE_CHOICE.UNKNOWN) {
      const result = {
        action: "REQUEST_VALUE_CHOICE",
        state: currentState,
        valueEngine: pending.valueEngine,
        ui: []
      };

      recordTurn(message, result);

      return result;
    }

    conversationContext.flightPreferences = {
      ...conversationContext.flightPreferences,
      ...choice.preferenceUpdate
    };

    const valueEngine = selectFlightValue(
      pending.results.itineraries,
      conversationContext.flightPreferences
    );

    if (
      valueEngine.recommendationStatus ===
      "NEEDS_USER_CHOICE"
    ) {
      conversationContext.pendingValueChoice = {
        ...pending,
        valueEngine
      };

      const result = {
        action: "REQUEST_VALUE_CHOICE",
        state: currentState,
        valueEngine,
        ui: []
      };

      recordTurn(message, result);

      return result;
    }

    conversationContext.pendingValueChoice = null;

    const result = buildSearchCompletedResult(
      currentState,
      pending.results,
      valueEngine
    );

    recordTurn(message, result);

    return result;
  }

  async function handleMessage(message) {
    if (!message || !message.trim()) {
      throw new Error("Message is required.");
    }

    const currentState = trip.get();

    if (conversationContext.pendingValueChoice) {
      return handleValueChoiceMessage(
        message,
        currentState
      );
    }

    if (
      currentState.status ===
      "READY_FOR_CONFIRMATION"
    ) {
      if (conversationContext.collectingCorrection) {
        return handleCorrectionMessage(
          message,
          currentState
        );
      }

      const turnUnderstanding =
        interpretConversationTurn({
          message,
          currentAction: "READY_FOR_CONFIRMATION"
        });
      const hasDeterministicPreference =
        hasPreferenceEvidence(
          turnUnderstanding.preferenceEvidence
        );

      if (
        !turnUnderstanding.correctionIntent &&
        (
          turnUnderstanding.confirmationIntent === "CONFIRM" ||
          hasDeterministicPreference
        )
      ) {
        applyPreferenceEvidence(
          turnUnderstanding.preferenceEvidence
        );

        console.info("[SCOUT] turn interpreted", {
          event: "turn_interpreted",
          currentAction: "READY_FOR_CONFIRMATION",
          deterministicSignals:
            turnUnderstanding.deterministicSignals,
          interpretedFields: Object.keys(
            turnUnderstanding.preferenceEvidence || {}
          ).filter(
            (field) =>
              turnUnderstanding.preferenceEvidence[field] != null
          ),
          route:
            turnUnderstanding.confirmationIntent === "CONFIRM"
              ? "confirm_and_search"
              : "request_confirmation",
          llmUsed: false
        });

        if (turnUnderstanding.confirmationIntent === "CONFIRM") {
          return confirmAndSearch(message);
        }

        const result = {
          action: "REQUEST_CONFIRMATION",
          nextAction: "REQUEST_CONFIRMATION",
          state: currentState
        };

        recordTurn(message, result);

        return result;
      }

      let confirmation;

      try {
        confirmation = await interpretConfirmation(
          message,
          currentState,
          history
        );
      } catch (error) {
        const result = {
          action: "CONFIRMATION_UNAVAILABLE",
          state: currentState
        };

        recordTurn(message, result);

        return result;
      }

      if (
        confirmation.intent ===
        "CONFIRM"
      ) {
        return confirmAndSearch(message);
      }

      if (
        confirmation.intent ===
        "CORRECT"
      ) {
        return handleCorrectionMessage(
          message,
          currentState
        );
      }

      recordTurn(
        message,
        "CONTINUE_CONVERSATION"
      );

      return {
        action: "CONTINUE_CONVERSATION",
        state: currentState
      };
    }

    if (
      currentState.status ===
      "CONFIRMED"
    ) {
      let results;

      try {
        results = await executeSearch(
          currentState
        );
      } catch (error) {
        const result = buildSearchUnavailableResult(currentState);

        recordTurn(message, result);

        return result;
      }

      const result = evaluateSearchResults(
        currentState,
        results
      );

      recordTurn(message, result);

      return result;
    }

    const contextNextAction =
      getNextConversationAction(currentState, conversationContext);

    const turnUnderstanding =
      interpretConversationTurn({
        message,
        currentAction: contextNextAction
      });

    let candidate;

    if (turnUnderstanding.childAge != null) {
      console.info("[SCOUT] turn interpreted", {
        event: "turn_interpreted",
        currentAction: contextNextAction,
        deterministicSignals:
          turnUnderstanding.deterministicSignals,
        llmUsed: false,
        route: "trip_update"
      });

      candidate =
        buildTripCandidateFromInterpretedEvidence(
          turnUnderstanding.tripEvidence,
          currentState,
          contextNextAction,
          message
        );
    } else {
      try {
        candidate =
          await buildTripCandidateFromEvidence(
            message,
            history,
            currentState,
            contextNextAction
          );
      } catch (error) {
        return recoverFromEvidenceFailure(
          message,
          currentState
        );
      }
    }

    applyPreferenceEvidence(
      candidate.preferenceEvidence
    );


    if (
      Array.isArray(candidate.travellerMentions) &&
      candidate.travellerMentions.length > 0
    ) {
      conversationContext.travellersEstablished = true;
    }

    const nextState =
      trip.update(candidate);
    const nextAction =
      getNextConversationAction(nextState, conversationContext);

    if (
      nextState.status ===
      "READY_FOR_CONFIRMATION"
    ) {
      const result = {
        action: "REQUEST_CONFIRMATION",
        nextAction: "REQUEST_CONFIRMATION",
        state: nextState
      };

      recordTurn(message, result);

      return result;
    }

    const result = {
      action: "COLLECT_TRIP_DETAILS",
      nextAction,
      state: nextState
    };

    recordTurn(message, result);

    return result;
  }

  function getState() {
    return trip.get();
  }

  function getHistory() {
    return [...history];
  }

  function reset() {
    history.length = 0;
    conversationContext.travellersEstablished = false;
    conversationContext.collectingCorrection = false;
    conversationContext.flightPreferences =
      initialFlightPreferences();
    conversationContext.pendingValueChoice = null;

    return trip.reset();
  }

  return {
    handleMessage,
    getState,
    getHistory,
    reset
  };
}

module.exports = {
  createConversationOrchestrator
};
