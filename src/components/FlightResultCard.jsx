const formatPrice = (currency, value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Price unavailable";
  }

  return `${currency || "USD"} ${amount.toFixed(2)}`;
};

const formatStops = (stops) => {
  const count = Number(stops || 0);

  if (count === 0) {
    return "Direct";
  }

  return `${count} stop${count === 1 ? "" : "s"}`;
};

export default function FlightResultCard({ data }) {
  const itinerary = data;

  if (!itinerary) {
    return null;
  }

  const outbound = itinerary.outbound;
  const inbound = itinerary.inbound;

  const totalPrice =
    itinerary.pricing?.totalTripPrice;

  const currency =
    itinerary.currency || "USD";

  return (
    <div className="mt-3 w-full max-w-xl overflow-hidden rounded-2xl border bg-background shadow-sm">
      <div className="border-b px-5 py-4">
        <div className="text-sm font-medium text-muted-foreground">
          Return flight
        </div>

        <div className="mt-1 text-lg font-semibold">
          {outbound?.from || "—"} → {outbound?.to || "—"} →{" "}
          {inbound?.to || "—"}
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {outbound?.from || "—"} → {outbound?.to || "—"}
            </span>

            <span className="text-sm text-muted-foreground">
              {formatStops(outbound?.stops)}
            </span>
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            {outbound?.departure || "Departure time unavailable"}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {inbound?.from || "—"} → {inbound?.to || "—"}
            </span>

            <span className="text-sm text-muted-foreground">
              {formatStops(inbound?.stops)}
            </span>
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            {inbound?.departure || "Departure time unavailable"}
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between border-t px-5 py-4">
        <div>
          <div className="text-xs text-muted-foreground">
            Total trip price
          </div>

          <div className="text-xl font-semibold">
            {formatPrice(currency, totalPrice)}
          </div>
        </div>

        <button
          type="button"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
        >
          Select
        </button>
      </div>
    </div>
  );
}
