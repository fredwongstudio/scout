const {
  resolveSupportedCity
} = require("./location-resolver");

const DATE_EVIDENCE_SOURCE = Object.freeze({
  CURRENT_TURN: "CURRENT_TURN",
  RECONSTRUCTED: "RECONSTRUCTED",
  NONE: "NONE"
});

const DATE_POLICY_ISSUE = Object.freeze({
  OUTSIDE_HORIZON: "OUTSIDE_HORIZON",
  BEFORE_DEPARTURE: "BEFORE_DEPARTURE"
});

function normalizeAirportCode(value) {
  return resolveSupportedCity(value);
}

function normalizeDestinationCountry(value) {
  const country = String(value || "").trim();
  return country || null;
}

function parseDateParts(value) {
  if (!value) return null;

  const raw = String(value).trim();

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return {
      raw,
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]) - 1,
      day: Number(isoMatch[3]),
      hasExplicitYear: true
    };
  }

  const match = raw.match(
    /^(\d{1,2})\s+([A-Za-z]{3,9})(?:\s*,?\s*(\d{4}))?$/
  );

  if (!match) return null;

  const months = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11
  };

  const month = months[match[2].toLowerCase()];

  if (month === undefined) return null;

  return {
    raw,
    year: match[3] ? Number(match[3]) : null,
    month,
    day: Number(match[1]),
    hasExplicitYear: Boolean(match[3])
  };
}

function toLocalDate(year, month, day) {
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function toDateString(date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfLocalDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function addCalendarYear(date) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + 1);
  return next;
}

function resolveRollingDate(value, referenceDate = new Date()) {
  const parts = parseDateParts(value);

  if (!parts) {
    return { value: null, issue: null };
  }

  const today = startOfLocalDay(referenceDate);
  const horizonEnd = addCalendarYear(today);
  let date;

  if (parts.hasExplicitYear) {
    date = toLocalDate(parts.year, parts.month, parts.day);
  } else {
    date = toLocalDate(today.getFullYear(), parts.month, parts.day);

    if (date && date < today) {
      date = toLocalDate(
        today.getFullYear() + 1,
        parts.month,
        parts.day
      );
    }
  }

  if (!date) {
    return { value: null, issue: null };
  }

  if (date < today || date > horizonEnd) {
    return {
      value: null,
      issue: DATE_POLICY_ISSUE.OUTSIDE_HORIZON
    };
  }

  return { value: toDateString(date), issue: null };
}

function normalizeDate(value, referenceDate = new Date()) {
  return resolveRollingDate(value, referenceDate).value;
}

function normalizeDateEvidenceSource(value, source) {
  if (Object.values(DATE_EVIDENCE_SOURCE).includes(source)) {
    return source;
  }

  // Compatibility for existing direct callers/tests. Runtime evidence always
  // supplies the explicit source field below.
  return value
    ? DATE_EVIDENCE_SOURCE.CURRENT_TURN
    : DATE_EVIDENCE_SOURCE.NONE;
}

function extractDateExpressions(message) {
  const text = String(message || "");
  const matches = [];
  const pattern = /\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s*,?\s*(\d{4}))?\b/gi;

  for (const match of text.matchAll(pattern)) {
    matches.push(match[0]);
  }

  return matches;
}

function useCurrentTurnDateExpression(value, message) {
  const candidate = parseDateParts(value);
  const expressions = extractDateExpressions(message);

  if (!candidate || expressions.length === 0) {
    return value;
  }

  const matchingExpression = expressions.find((expression) => {
    const parts = parseDateParts(expression);

    return parts &&
      parts.month === candidate.month &&
      parts.day === candidate.day;
  });

  return matchingExpression || value;
}

function hasCurrentTurnDateEvidence(value, message) {
  if (!String(message || "").trim()) {
    return true;
  }

  const candidate = parseDateParts(value);

  if (!candidate) {
    return false;
  }

  return extractDateExpressions(message).some((expression) => {
    const parts = parseDateParts(expression);

    return parts &&
      parts.month === candidate.month &&
      parts.day === candidate.day;
  }) || String(message).includes(String(value));
}

module.exports = {
  normalizeAirportCode,
  normalizeDate
};

function normalizeTripCandidate(
  candidate,
  referenceDate = new Date(),
  message = ""
) {
  if (!candidate) return {};

  const dateProvenance = {
    departureDate: normalizeDateEvidenceSource(
      candidate.departureDate,
      candidate.dateProvenance?.departureDate
    ),
    returnDate: normalizeDateEvidenceSource(
      candidate.returnDate,
      candidate.dateProvenance?.returnDate
    )
  };

  const departureResolution =
    dateProvenance.departureDate ===
      DATE_EVIDENCE_SOURCE.CURRENT_TURN &&
    hasCurrentTurnDateEvidence(candidate.departureDate, message)
      ? resolveRollingDate(
          useCurrentTurnDateExpression(
            candidate.departureDate,
            message
          ),
          referenceDate
        )
      : { value: null, issue: null };

  const returnResolution =
    dateProvenance.returnDate ===
      DATE_EVIDENCE_SOURCE.CURRENT_TURN &&
    hasCurrentTurnDateEvidence(candidate.returnDate, message)
      ? resolveRollingDate(
          useCurrentTurnDateExpression(
            candidate.returnDate,
            message
          ),
          referenceDate
        )
      : { value: null, issue: null };

  return {
    origin: candidate.origin
      ? normalizeAirportCode(candidate.origin)
      : null,

    destination: candidate.destination
      ? normalizeAirportCode(candidate.destination)
      : null,

    destinationCountry: normalizeDestinationCountry(
      candidate.destinationCountry
    ),

    departureDate: departureResolution.value,

    returnDate: returnResolution.value,

    dateProvenance,

    datePolicyIssues: {
      departureDate: departureResolution.issue,
      returnDate: returnResolution.issue
    },

    tripLengthDays:
      candidate.tripLengthDays != null
        ? Number(candidate.tripLengthDays)
        : null,

    tripType: candidate.tripType || null,

    travellerMentions: Array.isArray(candidate.travellerMentions)
      ? candidate.travellerMentions.map((traveller) => ({
          relation: traveller.relation,
          category: traveller.category,
          age:
            traveller.age != null
              ? Number(traveller.age)
              : null
        }))
      : []
  };
}

module.exports = {
  DATE_EVIDENCE_SOURCE,
  DATE_POLICY_ISSUE,
  normalizeAirportCode,
  normalizeDestinationCountry,
  normalizeDate,
  resolveRollingDate,
  normalizeTripCandidate
};
