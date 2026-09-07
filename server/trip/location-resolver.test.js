const test = require("node:test");
const assert = require("node:assert/strict");

const cities = require("../location/data/aviation-cities.json");
const airports = require("../location/data/aviation-locations.json");

const {
  findByIataCode
} = require("../location/location-repository");

const {
  resolveSupportedCity,
  getLocationDisplayName
} = require("./location-resolver");

test("city names resolve to their curated preferred airports", () => {
  for (const [city, airport] of [
    ["Tokyo", "HND"],
    ["London", "LHR"],
    ["Paris", "CDG"],
    ["New York", "JFK"],
    ["Bangkok", "BKK"]
  ]) {
    assert.equal(resolveSupportedCity(city), airport);
  }
});

test("every unambiguous curated city name uses its preferred airport", () => {
  const preferredCities = cities.locations.filter(
    (city) => city.preferredAirport
  );

  for (const city of preferredCities) {
    const sameNameCities = cities.locations.filter(
      (entry) => entry.name === city.name
    );

    if (sameNameCities.length === 1) {
      assert.equal(
        resolveSupportedCity(city.name),
        city.preferredAirport,
        `${city.name} should use ${city.preferredAirport}`
      );
    }
  }
});

test("explicit physical airport input remains authoritative", () => {
  for (const [input, airport] of [
    ["NRT", "NRT"],
    ["ORY", "ORY"],
    ["LGA", "LGA"],
    ["Narita International Airport", "NRT"],
    ["Paris-Orly Airport", "ORY"],
    ["LaGuardia Airport", "LGA"]
  ]) {
    assert.equal(resolveSupportedCity(input), airport);
  }
});

test("every curated preferred airport is a physical city member", () => {
  const preferredCities = cities.locations.filter(
    (city) => city.preferredAirport
  );

  assert.equal(preferredCities.length, 45);

  for (const city of preferredCities) {
    assert.ok(
      city.airports.includes(city.preferredAirport),
      `${city.name} must list ${city.preferredAirport} as a member airport`
    );
    assert.equal(
      findByIataCode(city.preferredAirport)?.type,
      "AIRPORT",
      `${city.preferredAirport} must resolve to a physical airport`
    );
  }
});

test("natural city display is retained for curated airports", () => {
  for (const [airport, city] of [
    ["HND", "Tokyo"],
    ["LHR", "London"],
    ["CDG", "Paris"],
    ["JFK", "New York"],
    ["BKK", "Bangkok"]
  ]) {
    assert.equal(getLocationDisplayName(airport), city);
  }
});

test("review records remain outside curated preferred-airport mapping", () => {
  for (const code of [
    "AIY", "AUW", "FMY", "FRU", "LUL", "MOW", "PFN", "PUM",
    "QDL", "RTW", "SDZ", "TIP", "TWB", "UBS", "YSW"
  ]) {
    const city = cities.locations.find(
      (entry) => entry.iataCode === code
    );

    assert.equal(city?.preferredAirport, undefined);
  }
});

test("named review records retain their existing fallback without curation", () => {
  for (const [code, expectedResolution] of [
    ["FRU", "BSZ"],
    ["PFN", "PFN"],
    ["RTW", "RTW"],
    ["YSW", "YFB"]
  ]) {
    const city = cities.locations.find(
      (entry) => entry.iataCode === code
    );

    assert.equal(
      resolveSupportedCity(city.name),
      expectedResolution
    );
  }
});
