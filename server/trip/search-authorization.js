const { TRIP_STATUS } = require("./status");

function assertFlightSearchAuthorized(tripState) {
  if (!tripState) {
    throw new Error("Trip state is required.");
  }

  if (tripState.status !== TRIP_STATUS.CONFIRMED) {
    throw new Error(
      "Flight search is not authorized. Trip must be CONFIRMED."
    );
  }

  return true;
}

module.exports = {
  assertFlightSearchAuthorized
};
