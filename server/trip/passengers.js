function mapTravellerMentionsToPassengers(travellerMentions) {
  const travellers = Array.isArray(travellerMentions)
    ? travellerMentions
    : [];

  return {
    adults: travellers.filter(
      (traveller) => traveller.category === "adult"
    ).length,

    children: travellers.filter(
      (traveller) => traveller.category === "child"
    ).length,

    infants: travellers.filter(
      (traveller) => traveller.category === "infant"
    ).length,

    childAges: travellers
      .filter(
        (traveller) =>
          traveller.category === "child" &&
          traveller.age != null &&
          Number.isFinite(Number(traveller.age))
      )
      .map((traveller) => Number(traveller.age))
  };
}

module.exports = {
  mapTravellerMentionsToPassengers
};
