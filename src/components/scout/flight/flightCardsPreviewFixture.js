export const previewFlightResult = {
  summary: {
    route: "Singapore → Tokyo",
    dates: "20 Dec 2026 → 26 Dec 2026",
    travellers: "2 adults · 1 child"
  },
  cards: [
    {
      id: "preview-scout-pick",
      label: "SCOUT'S PICK",
      airline: "TR",
      airlineCode: "TR",
      airlineName: "Scoot",
      flightIdentifier: "TR882",
      fare: null,
      outbound: {
        label: "OUTBOUND · 20 Dec",
        departureTime: "09:30",
        departureAirport: "SIN",
        arrivalTime: "17:15",
        arrivalAirport: "HND",
        duration: "6h 45m",
        stops: "Direct"
      },
      return: {
        label: "RETURN · 26 Dec",
        departureTime: "19:55",
        departureAirport: "HND",
        arrivalTime: "02:10",
        arrivalAirport: "SIN",
        duration: "7h 15m",
        stops: "Direct"
      },
      travellers: "2 adults · 1 child",
      price: {
        perPersonAmount: "US$579.83",
        amount: "US$1,739.50",
        label: "Total trip price"
      },
      action: "Select flight"
    },
    {
      id: "preview-best-alternative",
      label: "BEST ALTERNATIVE",
      airline: "SQ",
      airlineCode: "SQ",
      airlineName: "Singapore Airlines",
      flightIdentifier: "SQ012",
      fare: null,
      outbound: {
        label: "OUTBOUND · 20 Dec",
        departureTime: "12:10",
        departureAirport: "SIN",
        arrivalTime: "20:05",
        arrivalAirport: "NRT",
        duration: "6h 55m",
        stops: "Direct"
      },
      return: {
        label: "RETURN · 26 Dec",
        departureTime: "16:30",
        departureAirport: "NRT",
        arrivalTime: "23:20",
        arrivalAirport: "SIN",
        duration: "6h 50m",
        stops: "Direct"
      },
      travellers: "2 adults · 1 child",
      price: {
        perPersonAmount: "US$621.67",
        amount: "US$1,865.00",
        label: "Total trip price"
      },
      action: "Select flight"
    }
  ]
};
