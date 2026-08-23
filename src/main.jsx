import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import FlightCardDev from "./components/scout/flight/FlightCardDev";

import "./index.css";

const isFlightCardDev =
  new URLSearchParams(window.location.search).get(
    "flightCardDev"
  ) === "1";

const Root = isFlightCardDev
  ? FlightCardDev
  : App;

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
