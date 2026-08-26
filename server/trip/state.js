const { TRIP_STATUS } = require("./status");

const initialTripState = () => ({
  version: 0,
  status: TRIP_STATUS.INCOMPLETE,
  origin: null,
  destination: null,
  departureDate: null,
  returnDate: null,
  tripLengthDays: null,
  tripType: null,
  passengers: {
    adults: 0,
    children: 0,
    infants: 0,
    childAges: []
  }
});

module.exports = {
  initialTripState
};
