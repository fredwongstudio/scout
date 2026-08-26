export function formatAirlineDisplay({
  airlineName,
  airlineCode,
  airline,
} = {}) {
  const code = airlineCode || airline || null;

  if (airlineName && code) {
    return `${airlineName} (${code})`;
  }

  return code || airlineName || "Airline unavailable";
}
