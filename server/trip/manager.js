const { initialTripState } = require("./state");
const { applyTripCandidate } = require("./update");
const { confirmTrip } = require("./confirm");

function createTripManager() {
  let state = initialTripState();

  return {
    get() {
      return state;
    },

    update(candidate) {
      state = applyTripCandidate(state, candidate);
      return state;
    },

    confirm() {
      state = confirmTrip(state);
      return state;
    },

    reset() {
      state = initialTripState();
      return state;
    }
  };
}

module.exports = {
  createTripManager
};
