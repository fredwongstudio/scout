const DEMO_NAMES = {
  Adult: ["Fred Demo", "Jamie Demo", "Morgan Demo", "Taylor Demo"],
  Child: ["Alex Demo", "Riley Demo", "Casey Demo"],
  Infant: ["Avery Demo", "Jordan Demo"],
};

export const IDENTITY_METHODS = {
  SCOUT_TRAVEL_ID: "SCOUT_TRAVEL_ID",
  PASSPORT_UPLOAD: "PASSPORT_UPLOAD",
  MANUAL: "MANUAL",
};

export const IDENTITY_STATUSES = {
  NOT_STARTED: "NOT_STARTED",
  PROCESSING: "PROCESSING",
  READY: "READY",
};

export const PAYMENT_METHODS = {
  SCOUT_WALLET_USDC: "SCOUT_WALLET_USDC",
  SAVED_CARD: "SAVED_CARD",
};

export const PAYMENT_STATUSES = {
  NOT_SELECTED: "NOT_SELECTED",
  SELECTED: "SELECTED",
};

export const AUTHORIZATION_STATUSES = {
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
  AUTHORIZED: "AUTHORIZED",
};

export const EXECUTION_STATUSES = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

export const EXECUTION_STEPS = ["FARE", "TRAVELLERS", "PAYMENT", "BOOKING", "TICKETING"];

export const BOOKING_VIEWS = {
  CONFIRMATION: "CONFIRMATION",
  TRIP_DETAILS: "TRIP_DETAILS",
};

const PRE_AUTHORIZATION_BACK_STAGES = {
  TRAVELLER_IDENTITY: "REVIEW",
  FINAL_CONFIRMATION: "TRAVELLER_IDENTITY",
  PAYMENT: "FINAL_CONFIRMATION",
  REVIEW_AUTHORIZE: "PAYMENT",
};

const PRE_AUTHORIZATION_NEXT_STAGES = {
  TRAVELLER_IDENTITY: "FINAL_CONFIRMATION",
  FINAL_CONFIRMATION: "PAYMENT",
  PAYMENT: "REVIEW_AUTHORIZE",
};

// These are explicit local prototype fixtures. No wallet, card, or balance is
// connected, queried, persisted, or used for payment execution.
export const SIMULATED_PAYMENT_DISPLAY = {
  [PAYMENT_METHODS.SCOUT_WALLET_USDC]: {
    asset: "USDC",
    label: "SCOUT Wallet",
    availableBalance: "US$2,840.00 available",
    simulated: true,
  },
  [PAYMENT_METHODS.SAVED_CARD]: {
    brand: "Visa",
    last4: "4242",
    label: "Visa •••• 4242",
    simulated: true,
  },
};

// Display-only prototype convention: a rounded whole-dollar USD fare is shown
// as the same whole-number USDC amount. This is not a quote or settlement value.
export function formatSimulatedUsdcAmount(displayedUsdAmount) {
  if (typeof displayedUsdAmount !== "string") return null;

  const match = displayedUsdAmount.trim().match(/^US\$\s?(\d{1,3}(?:,\d{3})*|\d+)$/);
  return match ? `USDC ${match[1]}` : null;
}

export function isScoutWalletPayment(payment) {
  return payment?.method === PAYMENT_METHODS.SCOUT_WALLET_USDC;
}

export function createIdentityState() {
  return {
    method: null,
    status: IDENTITY_STATUSES.NOT_STARTED,
    travellers: [],
  };
}

/**
 * This parses only the existing presentation summary. Demo records below are
 * intentionally fictional and are not identity, passport, or booking data.
 */
export function getExpectedTravellerTypes(travellersSummary = "") {
  const labels = [
    ["Adult", /\b(\d+)\s+adult(?:s)?\b/i],
    ["Child", /\b(\d+)\s+child(?:ren)?\b/i],
    ["Infant", /\b(\d+)\s+infant(?:s)?\b/i],
  ];

  return labels.flatMap(([type, pattern]) => {
    const count = Number(travellersSummary.match(pattern)?.[1] || 0);
    return Array.from({ length: count }, () => type);
  });
}

export function createDemoTravellers(travellersSummary) {
  const usedNames = { Adult: 0, Child: 0, Infant: 0 };

  return getExpectedTravellerTypes(travellersSummary).map((type, index) => {
    const nameIndex = usedNames[type]++;
    const names = DEMO_NAMES[type];

    return {
      id: `demo-${type.toLowerCase()}-${index + 1}`,
      name: names[nameIndex] || `${type} Demo ${nameIndex + 1}`,
      type,
      status: "READY",
    };
  });
}

export function createProcessingIdentity(method) {
  return {
    method,
    status: IDENTITY_STATUSES.PROCESSING,
    travellers: [],
  };
}

export function createReadyIdentity(method, travellersSummary) {
  return {
    method,
    status: IDENTITY_STATUSES.READY,
    travellers: createDemoTravellers(travellersSummary),
  };
}

export function isIdentityReadyForPayment(identity, travellersSummary) {
  const expectedCount = getExpectedTravellerTypes(travellersSummary).length;

  return (
    identity?.status === IDENTITY_STATUSES.READY &&
    identity.travellers.length === expectedCount &&
    expectedCount > 0
  );
}

export function createPaymentState() {
  return {
    method: null,
    status: PAYMENT_STATUSES.NOT_SELECTED,
    display: null,
  };
}

export function createSelectedPayment(method) {
  const display = SIMULATED_PAYMENT_DISPLAY[method];

  if (!display) {
    return createPaymentState();
  }

  return {
    method,
    status: PAYMENT_STATUSES.SELECTED,
    display,
  };
}

export function isPaymentSelected(payment) {
  return payment?.status === PAYMENT_STATUSES.SELECTED && Boolean(payment.method);
}

export function createAuthorizationState() {
  return {
    status: AUTHORIZATION_STATUSES.NOT_AUTHORIZED,
    itineraryId: null,
    travellerIds: [],
    paymentMethod: null,
    amount: null,
    currency: null,
  };
}

export function getSelectedPriceContext(itinerary) {
  const amount = itinerary?.price?.amount || null;
  const currency = typeof amount === "string"
    ? amount.match(/^\s*([^\d\s]+)/)?.[1] || null
    : null;

  return { amount, currency };
}

export function createAuthorizedState(session) {
  const itinerary = session?.itinerary || session;

  return {
    status: AUTHORIZATION_STATUSES.AUTHORIZED,
    itineraryId: itinerary?.id || null,
    travellerIds: Array.isArray(session?.identity?.travellers)
      ? session.identity.travellers.map((traveller) => traveller.id)
      : [],
    paymentMethod: session?.payment?.method || null,
    ...getSelectedPriceContext(itinerary),
  };
}

export function isAuthorizationBindingCurrent(session) {
  const authorization = session?.authorization;

  if (authorization?.status !== AUTHORIZATION_STATUSES.AUTHORIZED) {
    return false;
  }

  const current = createAuthorizedState(session);

  return (
    authorization.itineraryId === current.itineraryId &&
    authorization.paymentMethod === current.paymentMethod &&
    authorization.amount === current.amount &&
    authorization.currency === current.currency &&
    authorization.travellerIds.length === current.travellerIds.length &&
    authorization.travellerIds.every((id, index) => id === current.travellerIds[index])
  );
}

export function getPaymentExecutionCopy(payment) {
  return isScoutWalletPayment(payment)
    ? { active: "Authorizing USDC payment...", complete: "USDC payment authorized" }
    : { active: "Authorizing card payment...", complete: "Card payment authorized" };
}

export function createExecutionState() {
  return {
    status: EXECUTION_STATUSES.NOT_STARTED,
    currentStep: null,
    steps: EXECUTION_STEPS.map((key) => ({ key, status: "PENDING" })),
    bookingReference: null,
    transactionReference: null,
  };
}

export function startExecution() {
  const execution = createExecutionState();
  execution.status = EXECUTION_STATUSES.IN_PROGRESS;
  execution.currentStep = EXECUTION_STEPS[0];
  execution.steps[0].status = "IN_PROGRESS";
  return execution;
}

export function advanceExecution(execution) {
  if (execution?.status !== EXECUTION_STATUSES.IN_PROGRESS) {
    return execution;
  }

  const currentIndex = EXECUTION_STEPS.indexOf(execution.currentStep);
  const steps = execution.steps.map((step) => ({ ...step }));

  if (currentIndex < 0) return execution;

  steps[currentIndex].status = "COMPLETED";
  const nextIndex = currentIndex + 1;

  if (nextIndex === EXECUTION_STEPS.length) {
    return {
      ...execution,
      status: EXECUTION_STATUSES.COMPLETED,
      currentStep: EXECUTION_STEPS[currentIndex],
      steps,
      bookingReference: "SCOUT-DEMO-7X4K2",
      transactionReference: "TX-DEMO-4F8P1",
    };
  }

  steps[nextIndex].status = "IN_PROGRESS";
  return {
    ...execution,
    currentStep: EXECUTION_STEPS[nextIndex],
    steps,
  };
}

export function canViewBooking(session) {
  return session?.execution?.status === EXECUTION_STATUSES.COMPLETED;
}

export function canViewTrip(session) {
  return session?.stage === "CONFIRMED";
}

export function createCompletionAcknowledgement(session) {
  const destination = session?.summary?.route?.split(" → ").at(-1) || "Your trip";
  const reference = session?.execution?.bookingReference || "Demo reference unavailable";

  return `${destination} is sorted 🎉 Your simulated flight booking is complete.\n\nBooking reference: ${reference}`;
}

export function getPreviousPreAuthorizationStage(stage) {
  return PRE_AUTHORIZATION_BACK_STAGES[stage] || null;
}

export function getNextPreAuthorizationStage(stage) {
  return PRE_AUTHORIZATION_NEXT_STAGES[stage] || null;
}

export function advanceBookingReview(session) {
  if (session?.stage !== "REVIEW" || session.offerRevalidated !== true) {
    return session;
  }

  return {
    ...session,
    stage: "TRAVELLER_IDENTITY",
  };
}

/**
 * Keeps a selected search result at the UI boundary. It intentionally holds
 * the existing presented itinerary rather than changing canonical trip state.
 */
export function createBookingReviewSession({ summary, itinerary }) {
  if (!itinerary?.id) {
    return null;
  }

  return {
    summary: summary || null,
    itinerary,
    stage: "REVIEW",
    offerRevalidated: false,
    view: BOOKING_VIEWS.CONFIRMATION,
    completionAcknowledged: false,
    identity: createIdentityState(),
    payment: createPaymentState(),
    authorization: createAuthorizationState(),
    execution: createExecutionState(),
  };
}

/**
 * Reopening the same presented itinerary preserves the local, pre-authorization
 * booking work. Choosing a different itinerary creates a clean transaction.
 */
export function selectBookingItinerary(currentSession, { summary, itinerary }) {
  if (!itinerary?.id) {
    return currentSession || null;
  }

  if (currentSession?.itinerary?.id === itinerary.id) {
    return {
      ...currentSession,
      summary: summary || currentSession.summary,
      stage: "REVIEW",
      view: BOOKING_VIEWS.CONFIRMATION,
    };
  }

  return createBookingReviewSession({ summary, itinerary });
}
