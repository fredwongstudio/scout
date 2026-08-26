import { FlightResultContent } from "../../ScoutDataUI";
import { previewFlightResult } from "./flightCardsPreviewFixture";

export { previewFlightResult } from "./flightCardsPreviewFixture";

export default function FlightCardsPreview() {
  return (
    <main className="scout-flight-preview-page">
      <div className="scout-flight-preview-brand">SCOUT</div>
      <section className="scout-flight-preview-content">
        <FlightResultContent data={previewFlightResult} />
      </section>
    </main>
  );
}
