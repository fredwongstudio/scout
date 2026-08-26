const airlines = require("./data/airlines.json");

const airlineNameByIata = new Map(
  airlines.map(({ iata, name }) => [iata, name])
);

function normalizeAirlineCode(value) {
  const code = String(value || "").trim().toUpperCase();

  return /^[A-Z0-9]{2}$/.test(code)
    ? code
    : null;
}

function getAirlineName(code) {
  const normalizedCode = normalizeAirlineCode(code);

  return normalizedCode
    ? airlineNameByIata.get(normalizedCode) || null
    : null;
}

module.exports = {
  getAirlineName,
  normalizeAirlineCode
};
