function normalizeFlights(atlasResponse) {
  if (!atlasResponse || !Array.isArray(atlasResponse.routings)) {
    return [];
  }

  return atlasResponse.routings.map((flight) => {
    const segments = flight.fromSegments || [];
    const first = segments[0];
    const last = segments[segments.length - 1];

    const durationMinutes = segments.reduce(
      (total, segment) => total + (segment.duration || 0),
      0
    );

    const seats = segments
      .map((segment) => segment.seatCount)
      .filter((value) => typeof value === "number");

    return {
      id: flight.fid,
      airline: first?.carrier,
      flightNumber: first?.flightNumber,
      from: first?.depAirport,
      to: last?.arrAirport,
      departure: first?.depTime,
      arrival: last?.arrTime,
      durationMinutes,
      stops: Math.max(segments.length - 1, 0),
      price: flight.adultPrice,
      tax: flight.adultTax,
      currency: flight.currency,
      seatsAvailable: seats.length ? Math.min(...seats) : null,
      baggage: flight.rule?.baggageElements || [],
      ancillarySupported: flight.ancillarySupported || []
    };
  });
}

module.exports = { normalizeFlights };

