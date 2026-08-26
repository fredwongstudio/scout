const { TRIP_STATUS } = require("./status");
const { isTripReadyForConfirmation } = require("./validation");

function confirmTrip(currentState) {
  if (!currentState) {
    throw new Error("Trip state is required.");
  }

  if (!isTripReadyForConfirmation(currentState)) {
    throw new Error(
      "Trip is not ready for confirmation."
    );
  }

  return {
    ...currentState,
    status: TRIP_STATUS.CONFIRMED,
    version: currentState.version + 1
  };
}

module.exports = {
  confirmTrip
};
