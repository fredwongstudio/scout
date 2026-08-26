const aviationLocations = require("./data/aviation-locations.json");
const aviationCities = require("./data/aviation-cities.json");

const GENERIC_AIRPORT_WORDS = new Set([
  "airport",
  "international",
  "aerodrome",
  "airfield",
  "airbase",
  "airstrip"
]);

function normalizeLookupValue(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function addToIndex(index, key, location) {
  if (!key) return;

  const existing = index.get(key) || [];

  if (!existing.some((entry) =>
    entry.iataCode === location.iataCode
  )) {
    existing.push(location);
  }

  index.set(key, existing);
}

function airportNameKeys(location) {
  const normalizedName = normalizeLookupValue(location.name);
  const nameTokens = normalizedName
    .split(" ")
    .filter((token) => !GENERIC_AIRPORT_WORDS.has(token));
  const keys = new Set([
    normalizedName,
    ...location.keywords.map(normalizeLookupValue)
  ]);

  for (let start = 0; start < nameTokens.length; start += 1) {
    for (let end = start + 1; end <= nameTokens.length; end += 1) {
      keys.add(nameTokens.slice(start, end).join(" "));
    }
  }

  return [...keys].filter(Boolean);
}

const locations = aviationLocations.locations;
const byIataCode = new Map();
const airportsByIataCode = new Map();
const byAirportName = new Map();
const byMunicipality = new Map();
const byCountryCode = new Map();
const byCityName = new Map();

for (const location of locations) {
  byIataCode.set(location.iataCode, location);
  airportsByIataCode.set(location.iataCode, location);

  for (const key of airportNameKeys(location)) {
    addToIndex(byAirportName, key, location);
  }

  addToIndex(
    byMunicipality,
    normalizeLookupValue(location.municipality),
    location
  );

  addToIndex(
    byCountryCode,
    String(location.countryCode || "").toUpperCase(),
    location
  );
}

for (const city of aviationCities.locations) {
  if (!byIataCode.has(city.iataCode)) {
    byIataCode.set(city.iataCode, city);
  }

  addToIndex(
    byCityName,
    normalizeLookupValue(city.name),
    city
  );
}

function findByIataCode(code) {
  return byIataCode.get(
    String(code || "").trim().toUpperCase()
  ) || null;
}

function findByAirportName(name) {
  return [
    ...(byAirportName.get(normalizeLookupValue(name)) || [])
  ];
}

function findByMunicipality(name) {
  return [
    ...(byMunicipality.get(normalizeLookupValue(name)) || [])
  ];
}

function findByCityName(name) {
  return [
    ...(byCityName.get(normalizeLookupValue(name)) || [])
  ];
}

function airportProminence(location) {
  const ranks = {
    large_airport: 0,
    medium_airport: 1,
    small_airport: 2,
    seaplane_base: 3
  };

  return ranks[location?.airportType] ?? 4;
}

function findBestExactLocation(value) {
  const key = normalizeLookupValue(value);

  if (!key) return null;

  const explicitIata = findByIataCode(value);

  if (explicitIata) {
    return explicitIata;
  }

  const candidates = new Map();

  function candidateFor(code) {
    const existing = candidates.get(code) || {
      iataCode: code,
      airport: airportsByIataCode.get(code) || null,
      city: null,
      airportNameMatch: false,
      municipalityMatch: false,
      cityMatch: false
    };

    candidates.set(code, existing);
    return existing;
  }

  for (const city of findByCityName(value)) {
    const candidate = candidateFor(city.iataCode);
    candidate.city = city;
    candidate.cityMatch = true;
  }

  for (const airport of findByAirportName(value)) {
    const candidate = candidateFor(airport.iataCode);
    candidate.airport = airport;
    candidate.airportNameMatch = true;
  }

  for (const airport of findByMunicipality(value)) {
    const candidate = candidateFor(airport.iataCode);
    candidate.airport = airport;
    candidate.municipalityMatch = true;
  }

  const rankedCandidates = [...candidates.values()]
    .map((candidate) => {
      const airportName = normalizeLookupValue(candidate.airport?.name);
      const primaryAirportNameExact =
        candidate.airportNameMatch && airportName === key;
      const dedicatedMetroMatch =
        candidate.cityMatch &&
        candidate.city?.referenceType === "METRO_REFERENCE";

      return {
        ...candidate,
        rank: [
          dedicatedMetroMatch ? 0 : 1,
          primaryAirportNameExact ? 0 : 1,
          candidate.airportNameMatch ? 0 : 1,
          airportProminence(candidate.airport),
          candidate.municipalityMatch ? 0 : 1,
          candidate.cityMatch ? 0 : 1,
          candidate.iataCode
        ]
      };
    })
    .sort((left, right) => {
      for (let index = 0; index < left.rank.length; index += 1) {
        if (left.rank[index] < right.rank[index]) return -1;
        if (left.rank[index] > right.rank[index]) return 1;
      }

      return 0;
    });

  const best = rankedCandidates[0];

  if (!best) return null;

  if (
    best.cityMatch &&
    best.city?.referenceType === "METRO_REFERENCE"
  ) {
    return best.city;
  }

  return best.airport || best.city || null;
}

function findByCountryCode(code) {
  return [
    ...(byCountryCode.get(
      String(code || "").trim().toUpperCase()
    ) || [])
  ];
}

module.exports = {
  findByIataCode,
  findByAirportName,
  findByMunicipality,
  findByCityName,
  findByCountryCode,
  findBestExactLocation
};
