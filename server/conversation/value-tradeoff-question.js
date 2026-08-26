function formatClockTime(value) {
  const compact = String(value || "").trim();

  if (/^\d{12}$/.test(compact)) {
    return `${compact.slice(8, 10)}:${compact.slice(10, 12)}`;
  }

  return compact || null;
}

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return null;
  }

  return Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2);
}

function formatStops(outboundStops, inboundStops) {
  if (outboundStops === 1 && inboundStops === 1) {
    return "a stop each way";
  }

  return `${outboundStops || 0} outbound stop${outboundStops === 1 ? "" : "s"} and ` +
    `${inboundStops || 0} return stop${inboundStops === 1 ? "" : "s"}`;
}

function formatValueTradeoffQuestion(valueEngineResult) {
  const candidates = valueEngineResult?.candidates || [];
  const baseline = candidates[0];
  const alternative = candidates[1];
  const directGain = valueEngineResult?.conflictingTradeoffs?.some(
    (tradeoff) =>
      tradeoff.type === "PREFERENCE_GAINED" &&
      tradeoff.preference === "DIRECT_PREFERRED"
  );
  const earlierReturn = valueEngineResult?.conflictingTradeoffs?.find(
    (tradeoff) => tradeoff.type === "RETURN_DEPARTS_EARLIER"
  );

  if (baseline && alternative && directGain && earlierReturn) {
    const currency =
      alternative.itinerary?.currency ||
      baseline.itinerary?.currency ||
      "USD";
    const savings = formatMoney(alternative.priceDelta);
    const returnTime = formatClockTime(
      earlierReturn.alternativeDeparture
    );

    return (
      `There's a trade-off here. The cheaper one saves ${currency} ${savings} ` +
      `but has ${formatStops(
        baseline.itinerary?.outbound?.stops,
        baseline.itinerary?.inbound?.stops
      )}. The direct one avoids the stops, but the flight home leaves at ` +
      `${returnTime} 😅 Which matters more — going direct or getting a better flight home?`
    );
  }

  return "There's a trade-off here. Which option matters more to you?";
}

module.exports = {
  formatValueTradeoffQuestion
};
