function evidenceToCandidate(evidence) {
  if (!evidence) {
    return {};
  }

  return {
    origin: evidence.origin,
    destination: evidence.destination,
    destinationCountry: evidence.destinationCountry,
    departureDate: evidence.departureDate,
    returnDate: evidence.returnDate,
    dateProvenance: evidence.dateProvenance,
    tripLengthDays: evidence.tripLengthDays,
    tripType: evidence.tripType,
    originExplicitlyEstablished:
      evidence.originExplicitlyEstablished === true,
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
