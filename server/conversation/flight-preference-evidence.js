const EMPTY_PREFERENCE_EVIDENCE = Object.freeze({
  outboundTiming: null,
  returnTiming: null,
  stopsPreference: null,
  valueTradeoff: null
});

const preferencePhrases = Object.freeze({
  outboundTiming: [
    {
      value: "AVOID_EARLY",
      phrases: [
        "no crazy early flights",
        "avoid early flights",
        "nothing too early",
        "no early morning flight",
        "no early morning flights"
      ]
    }
  ],
  returnTiming: [
    {
      value: "PREFER_LATE",
      phrases: [
        "maximise the last day",
        "late flight home is fine",
        "later return"
      ]
    }
  ],
  stopsPreference: [
    {
      value: "DIRECT_PREFERRED",
      phrases: [
        "direct please",
        "direct if possible",
        "no stops",
        "hate stopovers",
        "avoid stops"
      ]
    }
  ],
  valueTradeoff: [
    {
      value: "PRICE_FIRST",
      phrases: [
        "cheapest is fine",
        "just give me the cheapest",
        "price matters most",
        "cheapest please"
      ]
    },
    {
      value: "BALANCED",
      phrases: [
        "i don't mind paying a bit more for convenience",
        "happy to pay more if it's worth it"
      ]
    },
    {
      value: "CONVENIENCE_FIRST",
      phrases: [
        "convenience over price",
        "i'll pay more for the most convenient option"
      ]
    }
  ]
});

function normalizeMessage(message) {
  return String(message || "")
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function matchingValues(message, definitions) {
  return definitions
    .filter((definition) =>
      definition.phrases.some((phrase) =>
        message.includes(phrase)
      )
    )
    .map((definition) => definition.value);
}

// This deterministic extractor is a constrained v1 adapter for the current
// preference vocabulary, not the long-term conversational-intelligence layer.
function extractFlightPreferenceEvidence(message) {
  const normalizedMessage = normalizeMessage(message);

  return Object.fromEntries(
    Object.entries(preferencePhrases).map(
      ([dimension, definitions]) => {
        const values = [
          ...new Set(
            matchingValues(normalizedMessage, definitions)
          )
        ];

        return [
          dimension,
          values.length === 1 ? values[0] : null
        ];
      }
    )
  );
}

module.exports = {
  EMPTY_PREFERENCE_EVIDENCE,
  extractFlightPreferenceEvidence
};
