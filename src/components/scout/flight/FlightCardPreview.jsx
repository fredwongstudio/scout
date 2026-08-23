import FlightCard from "./FlightCard";

const sampleFlight = {
  id: "preview",
  airline: "ZG",
  currency: "USD",

  outbound: {
    from: "SIN",
    to: "BKK",
    departure: "2026-12-20T00:40:00",
    arrival: "2026-12-20T22:15:00",
    durationMinutes: 840,
    stops: 1,

    segments: [
      {
        carrier: "ZG",
        flightNumber: "ZG054",
        depAirport: "SIN",
        arrAirport: "NRT",
        depTime: "2026-12-20T00:40:00",
        arrTime: "2026-12-20T08:25:00",
        duration: 465
      },
      {
        carrier: "ZG",
        flightNumber: "ZG051",
        depAirport: "NRT",
        arrAirport: "BKK",
        depTime: "2026-12-20T17:00:00",
        arrTime: "2026-12-20T22:15:00",
        duration: 435
      }
    ]
  },

  inbound: {
    from: "BKK",
    to: "SIN",
    departure: "2026-12-25T23:45:00",
    arrival: "2026-12-25T23:10:00",
    durationMinutes: 800,
    stops: 1,

    segments: [
      {
        carrier: "ZG",
        flightNumber: "ZG052",
        depAirport: "BKK",
        arrAirport: "NRT",
        depTime: "2026-12-25T23:45:00",
        arrTime: "2026-12-26T07:30:00",
        duration: 465
      },
      {
        carrier: "ZG",
        flightNumber: "ZG053",
        depAirport: "NRT",
        arrAirport: "SIN",
        depTime: "2026-12-26T16:35:00",
        arrTime: "2026-12-26T23:10:00",
        duration: 395
      }
    ]
  },

  pricing: {
    travellerCounts: {
      adults: 2,
      children: 1,
      infants: 0
    },
    totalTripPrice: 6948.84
  },

  baggage: []
};

export default function FlightCardPreview() {
  return <FlightCard data={sampleFlight} />;
}
