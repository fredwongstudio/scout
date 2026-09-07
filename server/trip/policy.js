function addCalendarDays(dateString, days) {
  const [year, month, day] = String(dateString)
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  date.setUTCDate(date.getUTCDate() + Number(days));

  return date.toISOString().slice(0, 10);
}

function applyTripPolicy(state) {
  const result = JSON.parse(JSON.stringify(state || {}));

  if (!result.dateSources) {
    result.dateSources = {
      departureDate: null,
      returnDate: null
    };
  }

  if (!result.datePolicyIssues) {
    result.datePolicyIssues = {
      departureDate: null,
      returnDate: null
    };
  }

  if (!result.passengers) {
    result.passengers = {
      adults: 0,
      children: 0,
      infants: 0,
      childAges: []
    };
  }

  if (!result.tripType) {
    result.tripType = "ROUND_TRIP";
  }

  if (result.returnDate === undefined) {
    result.returnDate = null;
  }

  if (
    result.tripType === "ROUND_TRIP" &&
    !result.returnDate &&
    !result.datePolicyIssues.returnDate &&
    result.departureDate &&
    Number(result.tripLengthDays) > 0
  ) {
    result.returnDate = addCalendarDays(
      result.departureDate,
      Number(result.tripLengthDays)
    );
    result.dateSources.returnDate = "DERIVED";
  }

  if (result.tripType === "ONE_WAY") {
    result.returnDate = null;
    result.dateSources.returnDate = null;
    result.datePolicyIssues.returnDate = null;
  }

  return result;
}

module.exports = {
  applyTripPolicy
};
