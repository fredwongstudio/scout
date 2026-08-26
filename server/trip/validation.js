const { TRIP_STATUS } = require("./status");

function isValidDate(value) {
  if (!value || typeof value !== "string") return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
}

function isTripReadyForConfirmation(tripState) {
  if (!tripState) return false;

  if (!tripState.origin) return false;
  if (!tripState.destination) return false;

  if (!isValidDate(tripState.departureDate)) {
    return false;
  }

  if (!tripState.tripType) return false;

  if (tripState.tripType === "ROUND_TRIP") {
    if (!isValidDate(tripState.returnDate)) {
      return false;
    }
  }

  const passengers = tripState.passengers;

  if (!passengers) return false;

  const adults = Number(passengers.adults || 0);
  const children = Number(passengers.children || 0);
  const infants = Number(passengers.infants || 0);

  const totalPassengers = adults + children + infants;

  if (totalPassengers <= 0) return false;

  if (children > 0) {
    if (!Array.isArray(passengers.childAges)) {
      return false;
    }

    if (passengers.childAges.length !== children) {
      return false;
    }

    if (
      passengers.childAges.some(
        (age) => !Number.isFinite(Number(age))
      )
    ) {
      return false;
    }
  }

  return true;
}

function getTripStatus(tripState) {
  if (!isTripReadyForConfirmation(tripState)) {
    return TRIP_STATUS.INCOMPLETE;
  }

  return TRIP_STATUS.READY_FOR_CONFIRMATION;
}

module.exports = {
  isValidDate,
  isTripReadyForConfirmation,
  getTripStatus
};
