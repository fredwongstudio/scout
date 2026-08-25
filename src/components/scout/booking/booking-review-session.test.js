import assert from "node:assert/strict";
import test from "node:test";

import {
  createBookingReviewSession,
  createDemoTravellers,
  createIdentityState,
  createProcessingIdentity,
  createReadyIdentity,
  createPaymentState,
  createSelectedPayment,
  createAuthorizationState,
  createAuthorizedState,
  createExecutionState,
  startExecution,
  advanceExecution,
  canViewBooking,
  canViewTrip,
  BOOKING_VIEWS,
  createCompletionAcknowledgement,
  getExpectedTravellerTypes,
  IDENTITY_METHODS,
  IDENTITY_STATUSES,
  AUTHORIZATION_STATUSES,
  EXECUTION_STATUSES,
  EXECUTION_STEPS,
  getPaymentExecutionCopy,
  getPreviousPreAuthorizationStage,
  isAuthorizationBindingCurrent,
  isIdentityReadyForPayment,
  isPaymentSelected,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  selectBookingItinerary,
} from "./booking-review-session.js";
import { isValidConfirmationEmail } from "./trip-details-utils.js";

const summary = {
  route: "Singapore → Tokyo",
  dates: "20 Dec 2026 → 26 Dec 2026",
  travellers: "2 adults · 1 child",
};

const cardOne = {
  id: "atlas-itinerary-one",
  flightIdentifier: "TR882",
  price: { amount: "US$1,739.50" },
};

const cardTwo = {
  id: "atlas-itinerary-two",
  flightIdentifier: "SQ012",
  price: { amount: "US$1,865.00" },
};

test("creates a booking session from the exact selected first card", () => {
  const session = createBookingReviewSession({ summary, itinerary: cardOne });

  assert.equal(session.summary, summary);
  assert.equal(session.itinerary, cardOne);
  assert.equal(session.itinerary.id, "atlas-itinerary-one");
  assert.equal(session.itinerary.price.amount, "US$1,739.50");
  assert.equal(session.stage, "REVIEW");
  assert.equal(session.offerRevalidated, false);
  assert.deepEqual(session.identity, {
    method: null,
    status: "NOT_STARTED",
    travellers: [],
  });
  assert.deepEqual(session.payment, {
    method: null,
    status: "NOT_SELECTED",
    display: null,
  });
  assert.deepEqual(session.authorization, {
    status: "NOT_AUTHORIZED",
    itineraryId: null,
    travellerIds: [],
    paymentMethod: null,
    amount: null,
    currency: null,
  });
  assert.equal(session.execution.status, "NOT_STARTED");
  assert.equal(session.view, BOOKING_VIEWS.CONFIRMATION);
  assert.equal(session.completionAcknowledged, false);
});

test("derives only the expected traveller types from the selected itinerary summary", () => {
  assert.deepEqual(
    getExpectedTravellerTypes("2 adults · 1 child"),
    ["Adult", "Adult", "Child"],
  );
  assert.deepEqual(getExpectedTravellerTypes("Just me"), []);
});

test("creates fictional ready demo records for the required traveller count", () => {
  const travellers = createDemoTravellers("2 adults · 1 child");

  assert.equal(travellers.length, 3);
  assert.deepEqual(travellers.map((traveller) => traveller.type), ["Adult", "Adult", "Child"]);
  assert.ok(travellers.every((traveller) => traveller.status === "READY"));
  assert.ok(travellers.every((traveller) => traveller.name.endsWith("Demo")));
  assert.equal(IDENTITY_METHODS.SCOUT_TRAVEL_ID, "SCOUT_TRAVEL_ID");
  assert.equal(IDENTITY_STATUSES.READY, "READY");
});

test("Travel ID, passport, and manual simulations transition to ready deterministically", () => {
  for (const method of Object.values(IDENTITY_METHODS)) {
    const processing = createProcessingIdentity(method);
    const ready = createReadyIdentity(method, "2 adults · 1 child");

    assert.equal(processing.status, IDENTITY_STATUSES.PROCESSING);
    assert.equal(processing.travellers.length, 0);
    assert.equal(ready.status, IDENTITY_STATUSES.READY);
    assert.equal(ready.method, method);
    assert.equal(ready.travellers.length, 3);
  }
});

test("payment remains disabled until every expected demo traveller is ready", () => {
  const processing = createProcessingIdentity(IDENTITY_METHODS.SCOUT_TRAVEL_ID);
  const ready = createReadyIdentity(IDENTITY_METHODS.SCOUT_TRAVEL_ID, "2 adults · 1 child");

  assert.equal(isIdentityReadyForPayment(processing, "2 adults · 1 child"), false);
  assert.equal(isIdentityReadyForPayment({ ...ready, travellers: ready.travellers.slice(0, 2) }, "2 adults · 1 child"), false);
  assert.equal(isIdentityReadyForPayment(ready, "2 adults · 1 child"), true);
});

test("payment selection is UI-only, singular, and leaves the selected price unchanged", () => {
  const initial = createPaymentState();
  const wallet = createSelectedPayment(PAYMENT_METHODS.SCOUT_WALLET_USDC);
  const card = createSelectedPayment(PAYMENT_METHODS.SAVED_CARD);

  assert.equal(isPaymentSelected(initial), false);
  assert.equal(initial.method, null);
  assert.equal(wallet.status, PAYMENT_STATUSES.SELECTED);
  assert.equal(wallet.display.asset, "USDC");
  assert.equal(wallet.display.simulated, true);
  assert.equal(card.status, PAYMENT_STATUSES.SELECTED);
  assert.equal(card.display.label, "Visa •••• 4242");
  assert.equal(isPaymentSelected(card), true);
  assert.notEqual(wallet.method, card.method);
  assert.equal(createSelectedPayment(PAYMENT_METHODS.SAVED_CARD).method, PAYMENT_METHODS.SAVED_CARD);
  assert.equal(createSelectedPayment(PAYMENT_METHODS.SCOUT_WALLET_USDC).method, PAYMENT_METHODS.SCOUT_WALLET_USDC);
  assert.equal(cardOne.price.amount, "US$1,739.50");
});

test("authorization binds only to the exact selected itinerary price context", () => {
  const initial = createAuthorizationState();
  const authorizationSession = {
    itinerary: cardOne,
    identity: createReadyIdentity(IDENTITY_METHODS.SCOUT_TRAVEL_ID, "2 adults · 1 child"),
    payment: createSelectedPayment(PAYMENT_METHODS.SCOUT_WALLET_USDC),
  };
  const authorized = createAuthorizedState(authorizationSession);

  assert.equal(initial.status, AUTHORIZATION_STATUSES.NOT_AUTHORIZED);
  assert.equal(authorized.status, AUTHORIZATION_STATUSES.AUTHORIZED);
  assert.equal(authorized.amount, "US$1,739.50");
  assert.equal(authorized.currency, "US$");
  assert.equal(authorized.itineraryId, "atlas-itinerary-one");
  assert.deepEqual(authorized.travellerIds, ["demo-adult-1", "demo-adult-2", "demo-child-3"]);
  assert.equal(authorized.paymentMethod, PAYMENT_METHODS.SCOUT_WALLET_USDC);
  assert.equal(isAuthorizationBindingCurrent({ ...authorizationSession, authorization: authorized }), true);
  assert.equal(
    isAuthorizationBindingCurrent({
      ...authorizationSession,
      payment: createSelectedPayment(PAYMENT_METHODS.SAVED_CARD),
      authorization: authorized,
    }),
    false,
  );
});

test("authorized execution advances through deterministic local steps to clearly demo references", () => {
  let execution = startExecution();

  assert.equal(execution.status, EXECUTION_STATUSES.IN_PROGRESS);
  assert.equal(execution.currentStep, "FARE");
  for (let index = 0; index < EXECUTION_STEPS.length; index += 1) {
    execution = advanceExecution(execution);
  }

  assert.equal(execution.status, EXECUTION_STATUSES.COMPLETED);
  assert.ok(execution.steps.every((step) => step.status === "COMPLETED"));
  assert.match(execution.bookingReference, /DEMO/);
  assert.match(execution.transactionReference, /DEMO/);
  assert.equal(getPaymentExecutionCopy(PAYMENT_METHODS.SCOUT_WALLET_USDC).active, "Authorizing USDC payment...");
  assert.equal(getPaymentExecutionCopy(PAYMENT_METHODS.SAVED_CARD).active, "Authorizing card payment...");
  assert.equal(createExecutionState().status, EXECUTION_STATUSES.NOT_STARTED);
});

test("booking confirmation is gated by completed execution and reuses its existing demo references", () => {
  let execution = startExecution();

  assert.equal(canViewBooking({ execution }), false);
  for (let index = 0; index < EXECUTION_STEPS.length; index += 1) {
    execution = advanceExecution(execution);
  }

  assert.equal(canViewBooking({ execution }), true);
  assert.equal(execution.bookingReference, "SCOUT-DEMO-7X4K2");
  assert.equal(execution.transactionReference, "TX-DEMO-4F8P1");
});

test("trip details is UI-only navigation available only after the confirmed stage", () => {
  const session = { stage: "CONFIRMED", view: BOOKING_VIEWS.CONFIRMATION };

  assert.equal(canViewTrip(session), true);
  assert.equal(canViewTrip({ ...session, stage: "AGENT_EXECUTION" }), false);
  assert.equal(session.view, BOOKING_VIEWS.CONFIRMATION);
});

test("completion acknowledgement is fixed local copy using the existing destination and reference", () => {
  const message = createCompletionAcknowledgement({
    summary: { route: "Singapore → Tokyo" },
    execution: { bookingReference: "SCOUT-DEMO-7X4K2" },
  });

  assert.match(message, /^Tokyo is sorted 🎉/);
  assert.match(message, /simulated flight booking/);
  assert.match(message, /SCOUT-DEMO-7X4K2/);
});

test("email confirmation accepts only a minimally valid local email address", () => {
  assert.equal(isValidConfirmationEmail("user@example.com"), true);
  assert.equal(isValidConfirmationEmail("  user@example.com  "), true);
  assert.equal(isValidConfirmationEmail("not-an-email"), false);
  assert.equal(isValidConfirmationEmail("user@"), false);
});

test("preserves a distinct second-card identity and price", () => {
  const session = createBookingReviewSession({ summary, itinerary: cardTwo });

  assert.equal(session.itinerary, cardTwo);
  assert.equal(session.itinerary.id, "atlas-itinerary-two");
  assert.equal(session.itinerary.price.amount, "US$1,865.00");
});

test("does not fabricate unavailable commercial details in the booking session", () => {
  const session = createBookingReviewSession({ summary, itinerary: cardOne });

  assert.equal(session.itinerary.baggage, undefined);
  assert.equal(session.itinerary.fareConditions, undefined);
  assert.equal(session.itinerary.taxAmount, undefined);
  assert.equal(session.itinerary.price.amount, "US$1,739.50");
});

test("does not create a booking session without an itinerary identity", () => {
  assert.equal(
    createBookingReviewSession({ summary, itinerary: { price: {} } }),
    null,
  );
});

test("maps only pre-authorization stages back one step", () => {
  assert.equal(getPreviousPreAuthorizationStage("TRAVELLER_IDENTITY"), "REVIEW");
  assert.equal(getPreviousPreAuthorizationStage("PAYMENT"), "TRAVELLER_IDENTITY");
  assert.equal(getPreviousPreAuthorizationStage("REVIEW_AUTHORIZE"), "PAYMENT");
  assert.equal(getPreviousPreAuthorizationStage("REVIEW"), null);
  assert.equal(getPreviousPreAuthorizationStage("AGENT_EXECUTION"), null);
  assert.equal(getPreviousPreAuthorizationStage("CONFIRMED"), null);
});

test("reopening the same selected flight preserves completed pre-authorization state", () => {
  const current = {
    ...createBookingReviewSession({ summary, itinerary: cardOne }),
    stage: "PAYMENT",
    offerRevalidated: true,
    identity: createReadyIdentity(IDENTITY_METHODS.SCOUT_TRAVEL_ID, summary.travellers),
    payment: createSelectedPayment(PAYMENT_METHODS.SAVED_CARD),
  };

  const reopened = selectBookingItinerary(current, { summary, itinerary: cardOne });

  assert.equal(reopened.stage, "REVIEW");
  assert.equal(reopened.offerRevalidated, true);
  assert.equal(reopened.itinerary, cardOne);
  assert.deepEqual(reopened.identity, current.identity);
  assert.deepEqual(reopened.payment, current.payment);
});

test("selecting a different flight starts a clean transaction and invalidates authorization", () => {
  const current = {
    ...createBookingReviewSession({ summary, itinerary: cardOne }),
    stage: "REVIEW_AUTHORIZE",
    identity: createReadyIdentity(IDENTITY_METHODS.SCOUT_TRAVEL_ID, summary.travellers),
    payment: createSelectedPayment(PAYMENT_METHODS.SCOUT_WALLET_USDC),
  };
  current.authorization = createAuthorizedState(current);

  const replacement = selectBookingItinerary(current, { summary, itinerary: cardTwo });

  assert.equal(replacement.stage, "REVIEW");
  assert.equal(replacement.offerRevalidated, false);
  assert.equal(replacement.itinerary, cardTwo);
  assert.deepEqual(replacement.identity, createIdentityState());
  assert.deepEqual(replacement.payment, createPaymentState());
  assert.deepEqual(replacement.authorization, createAuthorizationState());
  assert.equal(replacement.execution.status, EXECUTION_STATUSES.NOT_STARTED);
});
