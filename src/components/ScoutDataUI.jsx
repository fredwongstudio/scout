import { useAssistantDataUI } from "@assistant-ui/react";
import FlightCard from "./scout/flight/FlightCard";

function FlightResultSummary({ summary }) {
  if (!summary) return null;

  return (
    <header className="scout-flight-result-summary">
      {summary.route && (
        <div className="scout-flight-result-route">
          {summary.route}
        </div>
      )}
      {summary.dates && (
        <div className="scout-flight-result-meta">
          {summary.dates}
        </div>
      )}
      {summary.travellers && (
        <div className="scout-flight-result-meta">
          {summary.travellers}
        </div>
      )}
    </header>
  );
}

export function FlightResultContent({ data, onSelectFlight }) {
  const cards = Array.isArray(data?.cards)
    ? data.cards
    : data
      ? [data]
      : [];

  return (
    <section
      className="scout-flight-results"
      aria-label="Flight options"
    >
      <FlightResultSummary summary={data?.summary} />
      <div className="scout-flight-results-grid">
        {cards.map((card, index) => (
          <FlightCard
            key={card.id || `flight-option-${index}`}
            data={card}
            onSelect={() => onSelectFlight?.({
              summary: data?.summary || null,
              itinerary: card,
            })}
          />
        ))}
      </div>
    </section>
  );
}

export default function ScoutDataUI({ onSelectFlight }) {
  useAssistantDataUI({
    name: "flight_result",
    render: (props) => (
      <FlightResultContent
        data={props.data}
        onSelectFlight={onSelectFlight}
      />
    ),
  });

  return null;
}
