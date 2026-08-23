import { useAssistantDataUI } from "@assistant-ui/react";
import FlightCard from "./scout/flight/FlightCard";

export default function ScoutDataUI() {
  useAssistantDataUI({
    name: "flight_result",
    render: (props) => {
      console.log("[SCOUT DataUI] flight_result received:", props);
      return <FlightCard {...props} />;
    },
  });

  return null;
}
