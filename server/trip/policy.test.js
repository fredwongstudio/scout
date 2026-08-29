const test = require("node:test");
const assert = require("node:assert/strict");

const { applyTripPolicy } = require("./policy");

function deriveReturnDate(departureDate, tripLengthDays) {
  return applyTripPolicy({
    tripType: "ROUND_TRIP",
    departureDate,
    returnDate: null,
    tripLengthDays,
    passengers: { adults: 1, children: 0, infants: 0, childAges: [] },
  }).returnDate;
}

test("derives a return date one calendar day per requested night", () => {
  assert.equal(deriveReturnDate("2026-09-03", 4), "2026-09-07");
});

test("derives return dates across a month boundary", () => {
  assert.equal(deriveReturnDate("2026-01-30", 4), "2026-02-03");
});

test("derives return dates across a year boundary", () => {
  assert.equal(deriveReturnDate("2026-12-30", 4), "2027-01-03");
});

test("derives return dates across a leap-day boundary", () => {
  assert.equal(deriveReturnDate("2028-02-27", 2), "2028-02-29");
});

test("derives a next-day return for one night", () => {
  assert.equal(deriveReturnDate("2026-09-03", 1), "2026-09-04");
});
