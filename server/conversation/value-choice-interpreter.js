const VALUE_CHOICE = Object.freeze({
  DIRECT: "DIRECT",
  BETTER_RETURN: "BETTER_RETURN",
  UNKNOWN: "UNKNOWN"
});

const directAnswers = new Set([
  "go direct",
  "direct",
  "no stops",
  "avoid stops"
]);

const betterReturnAnswers = new Set([
  "better flight home",
  "later return",
  "better return",
  "don't want 2am",
  "not 2am"
]);

function normalizeAnswer(message) {
  return String(message || "")
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");
}

function interpretValueChoice(message) {
  const answer = normalizeAnswer(message);

  if (directAnswers.has(answer)) {
    return {
      choice: VALUE_CHOICE.DIRECT,
      preferenceUpdate: {
        stopsPreference: "DIRECT_PREFERRED",
        returnTiming: "FLEXIBLE"
      }
    };
  }

  if (betterReturnAnswers.has(answer)) {
    return {
      choice: VALUE_CHOICE.BETTER_RETURN,
      preferenceUpdate: {
        stopsPreference: "FLEXIBLE",
        returnTiming: "PREFER_LATE"
      }
    };
  }

  return {
    choice: VALUE_CHOICE.UNKNOWN,
    preferenceUpdate: null
  };
}

module.exports = {
  VALUE_CHOICE,
  interpretValueChoice
};
