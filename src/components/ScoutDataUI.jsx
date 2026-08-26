import { useEffect, useRef } from "react";
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
  const resultRef = useRef(null);
  const positionedResultKeyRef = useRef(null);
  const cards = Array.isArray(data?.cards)
    ? data.cards
    : data
      ? [data]
      : [];
  const resultKey = cards
    .map((card, index) => card?.id || `flight-option-${index}`)
    .join("|");

  useEffect(() => {
    if (
      !resultKey ||
      positionedResultKeyRef.current === resultKey ||
      !window.matchMedia("(max-width: 620px)").matches
    ) {
      return undefined;
    }

    const result = resultRef.current;
    const viewport = result?.closest(
      '[data-slot="aui_thread-viewport"]'
    );
    const messageContent = result?.closest(
      '[data-slot="aui_assistant-message-content"]'
    );

    if (!result || !viewport || !messageContent) {
      return undefined;
    }

    let frame = null;
    let positioned = false;
    const observer = new ResizeObserver(([entry]) => {
      if (
        positioned ||
        frame !== null ||
        entry.contentRect.width <= 0 ||
        entry.contentRect.height <= 0
      ) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = null;

        const messageBounds = messageContent.getBoundingClientRect();
        const viewportBounds = viewport.getBoundingClientRect();
        const topBorderWidth = Number.parseFloat(
          window.getComputedStyle(messageContent).borderTopWidth
        ) || 0;
        const conversationLane = viewport.firstElementChild;
        const laneGutter = conversationLane
          ? Number.parseFloat(
              window.getComputedStyle(conversationLane).paddingLeft
            ) || 0
          : 0;

        viewport.scrollTo({
          top: Math.max(
            0,
            viewport.scrollTop +
              messageBounds.top -
              viewportBounds.top -
              topBorderWidth -
              laneGutter
          ),
          behavior: "auto",
        });

        positioned = true;
        positionedResultKeyRef.current = resultKey;
        observer.disconnect();
      });
    });

    // assistant-ui follows content growth from its own viewport observer.
    // This result-local observer schedules after that resize delivery, then
    // disconnects once the containing assistant message is positioned at top.
    observer.observe(result);

    return () => {
      observer.disconnect();
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [resultKey]);

  return (
    <section
      ref={resultRef}
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
