function normalizeSegments(segments) {
  const safeSegments =
    Array.isArray(segments) ? segments : [];

  if (!safeSegments.length) {
    return {
      segments: [],
      durationMinutes: 0,
      stops: 0
    };
  }

  const first = safeSegments[0];
  const last =
    safeSegments[safeSegments.length - 1];

  const durationMinutes =
    safeSegments.reduce(
      (total, segment) =>
        total + Number(segment.duration || 0),
      0
    );

  return {
    segments: safeSegments,
    from: first?.depAirport || null,
    to: last?.arrAirport || null,
    departure: first?.depTime || null,
    arrival: last?.arrTime || null,
    durationMinutes,
    stops: Math.max(
      safeSegments.length - 1,
      0
    )
  };
}

function normalizeRoundTripFlights(atlasResponse) {
  if (
    !atlasResponse ||
    !Array.isArray(atlasResponse.routings)
  ) {
    return [];
  }

  return atlasResponse.routings.map((routing) => {
    const outbound =
      normalizeSegments(routing.fromSegments);

    const inbound =
      normalizeSegments(routing.retSegments);

    const baggage =
      routing.rule?.baggageElements || [];

    const adults =
      routing.adultPrice != null
        ? {
            price: Number(routing.adultPrice),
            tax: Number(routing.adultTax || 0)
          }
        : null;

    const children =
      routing.childPrice != null
        ? {
            price: Number(routing.childPrice),
            tax: Number(routing.childTax || 0)
          }
        : null;

    const infants =
      routing.infantPrice != null
        ? {
            price: Number(routing.infantPrice),
            tax: Number(routing.infantTax || 0)
          }
        : null;

    return {
      id: routing.fid || null,
      status: "SEARCH_RESULT",
      routingIdentifier:
        routing.routingIdentifier || null,

      currency:
        routing.currency || null,

      airline:
        outbound.segments[0]?.carrier || null,

      outbound,
      inbound,

      pricing: {
        adult: adults,
        child: children,
        infant: infants
      },

      baggage,

      ancillarySupported:
        routing.ancillarySupported || [],

      separateBookings:
        routing.separateBookings ?? null,

      expireTime:
        routing.expireTime || null,

      refreshTime:
        routing.refreshTime || null,

      raw: routing
    };
  });
}

module.exports = {
  normalizeRoundTripFlights
};
