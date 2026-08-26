const legacyCityCompatibility = {
  "singapore (sin)": "SIN",
  bangkok: "BKK",
  "bangkok (bkk)": "BKK",
  "kuala lumpur": "KUL",
  "hong kong": "HKG",
  sydney: "SYD",
  bali: "DPS",
  denpasar: "DPS"
};

const {
  findByIataCode,
  findBestExactLocation
} = require("../location/location-repository");

const legacyCityDisplayNames = {
  BKK: "Bangkok",
  KUL: "Kuala Lumpur",
  HKG: "Hong Kong",
  SYD: "Sydney",
  DPS: "Bali"
};

function resolveSupportedCity(value) {
  const raw = String(value || "").trim();

  if (!raw) return null;

  const cityCode = raw.toUpperCase();

  const explicitIataLocation = findByIataCode(cityCode);

  if (explicitIataLocation) {
    return explicitIataLocation.iataCode;
  }

  const bestLocation = findBestExactLocation(raw);

  return bestLocation
    ? bestLocation.iataCode
    : legacyCityCompatibility[
      raw.toLowerCase().replace(/\s+/g, " ")
    ] || null;
}

function getLocationDisplayName(value) {
  const cityCode = String(value || "").trim().toUpperCase();

  if (!cityCode) return null;

  if (legacyCityDisplayNames[cityCode]) {
    return legacyCityDisplayNames[cityCode];
  }

  const location = findByIataCode(cityCode);

  return location?.type === "CITY"
    ? location.name
    : location?.municipality || location?.name || cityCode;
}

module.exports = {
  resolveSupportedCity,
  getLocationDisplayName
};
