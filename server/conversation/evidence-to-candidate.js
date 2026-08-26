function evidenceToCandidate(evidence) {
  if (!evidence) {
    return {};
  }

  return {
    origin: evidence.origin,
    destination: evidence.destination,
    departureDate: evidence.departureDate,
    returnDate: evidence.returnDate,
    tripLengthDays: evidence.tripLengthDays,
    tripType: evidence.tripType,
    travellerMentions: Array.isArray(
      evidence.travellerMentions
    )
      ? evidence.travellerMentions
      : []
  };
}

module.exports = {
  evidenceToCandidate
};
