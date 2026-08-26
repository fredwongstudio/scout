const VALUE_ENGINE_THRESHOLDS = Object.freeze({
  EARLY_OUTBOUND_BEFORE_MINUTES: 6 * 60,
  LATE_RETURN_FROM_MINUTES: 18 * 60,
  PRICE_FIRST_MAX_PREMIUM: 0.1,
  PRICE_FIRST_MAX_PREMIUM_AMOUNT: 100,
  BALANCED_MAX_PREMIUM: 0.25,
  BALANCED_MAX_PREMIUM_AMOUNT: 250
});

const DEFAULT_PREFERENCES = Object.freeze({
  outboundTiming: "FLEXIBLE",
  returnTiming: "FLEXIBLE",
  stopsPreference: "FLEXIBLE",
  valueTradeoff: "PRICE_FIRST"
});

const PREFERENCE_DEFINITIONS = Object.freeze([
  {
    name: "AVOID_EARLY",
    enabled: (preferences) => preferences.outboundTiming === "AVOID_EARLY",
    satisfied: (traits) => !traits.earlyOutbound
  },
  {
    name: "PREFER_LATE",
    enabled: (preferences) => preferences.returnTiming === "PREFER_LATE",
    satisfied: (traits) => traits.lateReturn
  },
  {
    name: "DIRECT_PREFERRED",
    enabled: (preferences) => preferences.stopsPreference === "DIRECT_PREFERRED",
    satisfied: (traits) => traits.directBothWays
  }
]);

function toMinutes(time) {
  if (typeof time !== "string") {
    return null;
  }

  const compact = time.trim();
  const clock =
    /^\d{12}$/.test(compact)
      ? compact.slice(-4)
      : compact;
  const match = clock.match(/(?:^|\D)(\d{2}):?(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function getPrice(itinerary) {
  const price = Number(itinerary?.pricing?.totalTripPrice);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function deriveTraits(itinerary) {
  const outboundMinutes = toMinutes(itinerary?.outbound?.departure);
  const inboundMinutes = toMinutes(itinerary?.inbound?.departure);

  return {
    earlyOutbound:
      outboundMinutes !== null &&
      outboundMinutes < VALUE_ENGINE_THRESHOLDS.EARLY_OUTBOUND_BEFORE_MINUTES,
    lateReturn:
      inboundMinutes !== null &&
      inboundMinutes >= VALUE_ENGINE_THRESHOLDS.LATE_RETURN_FROM_MINUTES,
    directBothWays:
      itinerary?.outbound?.stops === 0 && itinerary?.inbound?.stops === 0
  };
}

function mergePreferences(preferences = {}) {
  return { ...DEFAULT_PREFERENCES, ...preferences };
}

function requestedPreferences(preferences) {
  return PREFERENCE_DEFINITIONS.filter((definition) =>
    definition.enabled(preferences)
  );
}

function satisfaction(candidate, definitions) {
  return {
    satisfiedPreferences: definitions
      .filter((definition) => definition.satisfied(candidate.traits))
      .map((definition) => definition.name),
    unmetPreferences: definitions
      .filter((definition) => !definition.satisfied(candidate.traits))
      .map((definition) => definition.name)
  };
}

function satisfactionCount(candidate, definitions) {
  return satisfaction(candidate, definitions).satisfiedPreferences.length;
}

function hasNoWorseStatedTraits(candidate, comparison, definitions) {
  return definitions.every(
    (definition) =>
      !definition.satisfied(candidate.traits) ||
      definition.satisfied(comparison.traits)
  );
}

function removeDominated(candidates, definitions) {
  return candidates.filter((candidate) =>
    !candidates.some(
      (comparison) =>
        comparison !== candidate &&
        comparison.price <= candidate.price &&
        hasNoWorseStatedTraits(candidate, comparison, definitions) &&
        (comparison.price < candidate.price ||
          satisfactionCount(comparison, definitions) >
            satisfactionCount(candidate, definitions))
    )
  );
}

function leastExpensive(candidates) {
  return [...candidates].sort(
    (left, right) => left.price - right.price || left.index - right.index
  )[0];
}

function isWithinPremium(candidate, cheapest, percentLimit, amountLimit) {
  const delta = candidate.price - cheapest.price;
  return delta <= amountLimit && delta <= cheapest.price * percentLimit;
}

function existingPremiumGuardrail(preferences) {
  return preferences.valueTradeoff === "PRICE_FIRST"
    ? {
        percent: VALUE_ENGINE_THRESHOLDS.PRICE_FIRST_MAX_PREMIUM,
        amount: VALUE_ENGINE_THRESHOLDS.PRICE_FIRST_MAX_PREMIUM_AMOUNT
      }
    : {
        percent: VALUE_ENGINE_THRESHOLDS.BALANCED_MAX_PREMIUM,
        amount: VALUE_ENGINE_THRESHOLDS.BALANCED_MAX_PREMIUM_AMOUNT
      };
}

function fullMatches(candidates, definitions) {
  return candidates.filter(
    (candidate) => satisfactionCount(candidate, definitions) === definitions.length
  );
}

function meaningfulAlternative(frontier, cheapest, definitions) {
  const cheapestAssessment = satisfaction(cheapest, definitions);
  return leastExpensive(
    frontier.filter((candidate) =>
      cheapestAssessment.unmetPreferences.some((preference) =>
        satisfaction(candidate, definitions).satisfiedPreferences.includes(preference)
      )
    )
  );
}

function priceComparison(candidate, cheapest) {
  const priceDelta =
    Math.round((candidate.price - cheapest.price) * 100) / 100;

  return {
    priceDelta,
    priceDeltaPercent:
      cheapest.price === 0
        ? 0
        : Math.round((priceDelta / cheapest.price) * 10000) / 100
  };
}

function candidateOutput(candidate, cheapest, definitions) {
  const assessment = satisfaction(candidate, definitions);
  return {
    itinerary: candidate.itinerary,
    ...priceComparison(candidate, cheapest),
    ...assessment
  };
}

function scheduleTradeoffs(cheapest, alternative, definitions) {
  const tradeoffs = [];
  const cheapestInbound = toMinutes(cheapest.itinerary?.inbound?.departure);
  const alternativeInbound = toMinutes(alternative.itinerary?.inbound?.departure);

  if (
    definitions.some((definition) => definition.name === "PREFER_LATE") &&
    cheapestInbound !== null &&
    alternativeInbound !== null &&
    alternativeInbound < cheapestInbound
  ) {
    tradeoffs.push({
      preference: "PREFER_LATE",
      type: "RETURN_DEPARTS_EARLIER",
      baselineDeparture: cheapest.itinerary.inbound.departure,
      alternativeDeparture: alternative.itinerary.inbound.departure
    });
  }

  return tradeoffs;
}

function conflictingTradeoffs(cheapest, alternative, definitions) {
  const cheapestAssessment = satisfaction(cheapest, definitions);
  const alternativeAssessment = satisfaction(alternative, definitions);
  const gainedPreferences = alternativeAssessment.satisfiedPreferences.filter(
    (preference) => !cheapestAssessment.satisfiedPreferences.includes(preference)
  );
  const lostPreferences = cheapestAssessment.satisfiedPreferences.filter(
    (preference) => !alternativeAssessment.satisfiedPreferences.includes(preference)
  );

  return [
    ...gainedPreferences.map((preference) => ({
      type: "PREFERENCE_GAINED",
      preference,
      baselineItinerary: cheapest.itinerary,
      alternativeItinerary: alternative.itinerary
    })),
    ...lostPreferences.map((preference) => ({
      type: "PREFERENCE_SACRIFICED",
      preference,
      baselineItinerary: cheapest.itinerary,
      alternativeItinerary: alternative.itinerary
    })),
    ...scheduleTradeoffs(cheapest, alternative, definitions).map((tradeoff) => ({
      ...tradeoff,
      baselineItinerary: cheapest.itinerary,
      alternativeItinerary: alternative.itinerary
    }))
  ];
}

function commonAssessment(candidates, definitions) {
  return {
    satisfiedPreferences: definitions
      .filter((definition) =>
        candidates.every((candidate) => definition.satisfied(candidate.traits))
      )
      .map((definition) => definition.name),
    unmetPreferences: definitions
      .filter((definition) =>
        candidates.every((candidate) => !definition.satisfied(candidate.traits))
      )
      .map((definition) => definition.name)
  };
}

function recommendationReasons(recommended, cheapest, definitions) {
  const assessment = satisfaction(recommended, definitions);
  const reasons = [];

  if (recommended === cheapest) {
    reasons.push("CHEAPEST_VALID_ITINERARY");
  }
  if (assessment.satisfiedPreferences.includes("AVOID_EARLY")) {
    reasons.push("AVOIDS_EARLY_OUTBOUND");
  }
  if (assessment.satisfiedPreferences.includes("PREFER_LATE")) {
    reasons.push("PREFERS_LATE_RETURN");
  }
  if (assessment.satisfiedPreferences.includes("DIRECT_PREFERRED")) {
    reasons.push("DIRECT_BOTH_WAYS");
  }
  if (recommended !== cheapest) {
    reasons.push("PREFERENCE_IMPROVEMENT_WITHIN_PRICE_GUARDRAIL");
  }
  if (assessment.unmetPreferences.length) {
    reasons.push("UNMET_PREFERENCES_REMAIN");
  }

  return reasons;
}

function recommendedOutput(recommended, cheapest, definitions) {
  const assessment = satisfaction(recommended, definitions);
  return {
    recommendationStatus: "RECOMMENDED",
    recommendedItinerary: recommended.itinerary,
    cheapestItinerary: cheapest.itinerary,
    ...priceComparison(recommended, cheapest),
    reasons: recommendationReasons(recommended, cheapest, definitions),
    ...assessment,
    conflictingTradeoffs: [],
    candidates: [],
    tradeoff: null
  };
}

function needsUserChoiceOutput(cheapest, alternative, definitions) {
  const candidates = [
    candidateOutput(cheapest, cheapest, definitions),
    candidateOutput(alternative, cheapest, definitions)
  ];
  const tradeoffs = conflictingTradeoffs(cheapest, alternative, definitions);

  return {
    recommendationStatus: "NEEDS_USER_CHOICE",
    recommendedItinerary: null,
    cheapestItinerary: cheapest.itinerary,
    priceDelta: null,
    priceDeltaPercent: null,
    reasons: ["NO_FULL_PREFERENCE_MATCH", "USER_CHOICE_REQUIRED"],
    ...commonAssessment([cheapest, alternative], definitions),
    conflictingTradeoffs: tradeoffs,
    candidates,
    tradeoff: {
      baselineItinerary: cheapest.itinerary,
      alternativeItinerary: alternative.itinerary,
      priceDelta: candidates[1].priceDelta,
      priceDeltaPercent: candidates[1].priceDeltaPercent,
      facts: tradeoffs
    }
  };
}

function selectFlightValue(itineraries, flightPreferences) {
  if (!Array.isArray(itineraries)) {
    throw new TypeError("Itineraries must be an array.");
  }

  const preferences = mergePreferences(flightPreferences);
  const definitions = requestedPreferences(preferences);
  const candidates = itineraries
    .map((itinerary, index) => ({
      itinerary,
      index,
      price: getPrice(itinerary),
      traits: deriveTraits(itinerary)
    }))
    .filter((candidate) => candidate.price !== null);

  if (!candidates.length) {
    return {
      recommendationStatus: "RECOMMENDED",
      recommendedItinerary: null,
      cheapestItinerary: null,
      priceDelta: null,
      priceDeltaPercent: null,
      reasons: ["NO_VALID_PRICED_ITINERARIES"],
      satisfiedPreferences: [],
      unmetPreferences: [],
      conflictingTradeoffs: [],
      candidates: [],
      tradeoff: null
    };
  }

  const cheapest = leastExpensive(candidates);
  if (!definitions.length) {
    return recommendedOutput(cheapest, cheapest, definitions);
  }

  const frontier = removeDominated(candidates, definitions);
  const matching = fullMatches(frontier, definitions);

  if (matching.length) {
    const candidate = leastExpensive(matching);
    if (preferences.valueTradeoff === "CONVENIENCE_FIRST") {
      return recommendedOutput(candidate, cheapest, definitions);
    }

    const guardrail = existingPremiumGuardrail(preferences);
    if (isWithinPremium(candidate, cheapest, guardrail.percent, guardrail.amount)) {
      return recommendedOutput(candidate, cheapest, definitions);
    }
  }

  if (preferences.valueTradeoff === "PRICE_FIRST") {
    return recommendedOutput(cheapest, cheapest, definitions);
  }

  const alternative = meaningfulAlternative(frontier, cheapest, definitions);

  if (preferences.valueTradeoff === "CONVENIENCE_FIRST" && alternative) {
    return needsUserChoiceOutput(cheapest, alternative, definitions);
  }

  if (alternative) {
    const guardrail = existingPremiumGuardrail(preferences);
    if (isWithinPremium(alternative, cheapest, guardrail.percent, guardrail.amount)) {
      return recommendedOutput(alternative, cheapest, definitions);
    }
  }

  return recommendedOutput(cheapest, cheapest, definitions);
}

module.exports = {
  DEFAULT_PREFERENCES,
  VALUE_ENGINE_THRESHOLDS,
  selectFlightValue
};
