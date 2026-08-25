import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import FlightCardsPreview from "./components/scout/flight/FlightCardsPreview";
import BookingReviewPreview from "./components/scout/booking/BookingReviewPreview";
import TravellerIdentityPreview from "./components/scout/booking/TravellerIdentityPreview";
import PaymentMethodPreview from "./components/scout/booking/PaymentMethodPreview";
import ReviewAuthorizePreview from "./components/scout/booking/ReviewAuthorizePreview";
import AgentExecutionPreview from "./components/scout/booking/AgentExecutionPreview";
import BookingConfirmationPreview from "./components/scout/booking/BookingConfirmationPreview";
import TripDetailsPreview from "./components/scout/booking/TripDetailsPreview";

import "./index.css";

const previewByPath = {
  "/dev/flight-cards": FlightCardsPreview,
  "/dev/booking-review": BookingReviewPreview,
  "/dev/traveller-identity": TravellerIdentityPreview,
  "/dev/payment-method": PaymentMethodPreview,
  "/dev/review-authorize": ReviewAuthorizePreview,
  "/dev/agent-execution": AgentExecutionPreview,
  "/dev/booking-confirmation": BookingConfirmationPreview,
  "/dev/trip-details": TripDetailsPreview,
};

const Root = previewByPath[window.location.pathname] || App;

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
