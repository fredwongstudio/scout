const {
  resolveSupportedCity
} = require("./location-resolver");

function normalizeAirportCode(value) {
  return resolveSupportedCity(value);
}

function normalizeDestinationCountry(value) {
  const country = String(value || "").trim();
  return country || null;
}

function normalizeDate(value, referenceDate = new Date()) {
  if (!value) return null;

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const match = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,9})$/);

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

  const year = referenceDate.getFullYear();
  const day = Number(match[1]);

  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

module.exports = {
  normalizeAirportCode,
  normalizeDate
};

function normalizeTripCandidate(candidate) {
  if (!candidate) return {};

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

    departureDate: normalizeDate(candidate.departureDate),

    returnDate: normalizeDate(candidate.returnDate),

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
  normalizeAirportCode,
  normalizeDestinationCountry,
  normalizeDate,
  normalizeTripCandidate
};
