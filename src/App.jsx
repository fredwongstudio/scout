import { useEffect, useRef, useState } from "react";

import {
  AssistantRuntimeProvider,
  AuiIf,
  ComposerPrimitive,
  ThreadPrimitive,
  useAuiState,
} from "@assistant-ui/react";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Thread } from "@/components/assistant-ui/thread";
import { useScoutRuntime } from "./runtime";
import ScoutDataUI from "./components/ScoutDataUI";
import BookingReview from "./components/scout/booking/BookingReview";
import TravellerIdentity from "./components/scout/booking/TravellerIdentity";
import PaymentMethod from "./components/scout/booking/PaymentMethod";
import ReviewAuthorize from "./components/scout/booking/ReviewAuthorize";
import AgentExecution from "./components/scout/booking/AgentExecution";
import BookingConfirmation from "./components/scout/booking/BookingConfirmation";
import TripDetails from "./components/scout/booking/TripDetails";
import {
  createAuthorizationState,
  createAuthorizedState,
  createExecutionState,
  createSelectedPayment,
  canViewBooking,
  canViewTrip,
  createCompletionAcknowledgement,
  getPreviousPreAuthorizationStage,
  BOOKING_VIEWS,
  isIdentityReadyForPayment,
  isPaymentSelected,
  selectBookingItinerary,
} from "./components/scout/booking/booking-review-session";
import bangkokBtsBackground from "../assets/2 Bangkok BTS.mp4";
import hongKongBackground from "../assets/2 Hong Kong.mp4";
import kyotoBackground from "../assets/2 Kyoto.mp4";
import seoulBackground from "../assets/2 Seoul.mp4";
import "./styles.css";

const BACKGROUND_VIDEOS = [
  bangkokBtsBackground,
  hongKongBackground,
  kyotoBackground,
  seoulBackground,
];
const BACKGROUND_VIDEO_START_OFFSETS = [1.75, 0, 0, 0];
const BACKGROUND_DISPLAY_MS = 5_000;

function RotatingBackground() {
  const videoRefs = useRef([]);
  const [visibleLayer, setVisibleLayer] = useState(0);
  const [layerIndexes, setLayerIndexes] = useState([0, 1]);
  const [pendingLayer, setPendingLayer] = useState(null);

  const applyStartOffset = (layer) => {
    const video = videoRefs.current[layer];
    const startOffset = BACKGROUND_VIDEO_START_OFFSETS[layerIndexes[layer]];

    if (video && startOffset > 0) {
      video.currentTime = startOffset;
    }
  };

  const showPendingLayer = () => {
    if (pendingLayer === null) return;

    const video = videoRefs.current[pendingLayer];
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    video.currentTime = BACKGROUND_VIDEO_START_OFFSETS[layerIndexes[pendingLayer]];
    video.play().catch(() => {});
    setVisibleLayer(pendingLayer);
    setPendingLayer(null);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextLayer = visibleLayer === 0 ? 1 : 0;
      const nextIndex = (layerIndexes[visibleLayer] + 1) % BACKGROUND_VIDEOS.length;

      setLayerIndexes((current) =>
        current.map((index, layer) => (layer === nextLayer ? nextIndex : index)),
      );
      setPendingLayer(nextLayer);
    }, BACKGROUND_DISPLAY_MS);

    return () => window.clearTimeout(timer);
  }, [layerIndexes, visibleLayer]);

  useEffect(() => {
    showPendingLayer();
  }, [layerIndexes, pendingLayer]);

  return (
    <>
      {[0, 1].map((layer) => (
        <video
          key={layer}
          ref={(element) => {
            videoRefs.current[layer] = element;
          }}
          className={`scout-bg-video${visibleLayer === layer ? " is-visible" : ""}`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src={BACKGROUND_VIDEOS[layerIndexes[layer]]}
          aria-hidden="true"
          onLoadedMetadata={() => applyStartOffset(layer)}
          onCanPlay={showPendingLayer}
        />
      ))}
    </>
  );
}

function ScoutComposer() {
  return (
    <ComposerPrimitive.Root className="scout-composer">
      <ComposerPrimitive.Input
        placeholder="Where do we feel like going next..."
        className="scout-composer-input"
        rows={1}
        autoFocus
        enterKeyHint="send"
        aria-label="Message input"
      />
      <div className="scout-composer-actions">
        <button
          type="button"
          className="scout-composer-plus"
          aria-label="Add inspiration"
        >
          +
        </button>

        <AuiIf condition={(s) => !s.thread.isRunning}>
          <ComposerPrimitive.Send
            className="scout-composer-send"
            aria-label="Send message"
          >
            <ArrowUpIcon size={18} strokeWidth={2} />
          </ComposerPrimitive.Send>
        </AuiIf>

        <AuiIf condition={(s) => s.thread.isRunning}>
          <ComposerPrimitive.Cancel
            className="scout-composer-send"
            aria-label="Stop generating"
          >
            <SquareIcon size={14} fill="currentColor" />
          </ComposerPrimitive.Cancel>
        </AuiIf>
      </div>
    </ComposerPrimitive.Root>
  );
}

function EmptyComposer() {
  return (
    <>
      <div className="scout-empty-composer">
        <ScoutComposer />
      </div>
      <div className="scout-composer-descriptor">
        Agentic Commerce Flight Booking Prototype
      </div>
    </>
  );
}

function ScoutThinking() {
  return (
    <AuiIf condition={(s) => s.thread.isRunning}>
      <div className="scout-thinking" aria-live="polite" aria-label="SCOUT is thinking">
        <span className="scout-thinking-label">SCOUT is thinking...</span>
        <span className="scout-thinking-signal" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
    </AuiIf>
  );
}

function ActiveThread() {
  return (
    <section className="scout-active-thread" aria-label="SCOUT conversation">
      <Thread
        className="scout-thread-root"
        components={{
          Composer: ScoutComposer,
          Thinking: ScoutThinking
        }}
      />
    </section>
  );
}

function ScoutChat() {
  const isEmpty = useAuiState(
    (state) => state.thread.messages.length === 0 && !state.thread.isLoading
  );

  return isEmpty ? <EmptyComposer /> : <ActiveThread />;
}

function ScoutShell({ onHardReset, onNewTrip, bookingSession, bookingExperienceOpen, onContinueBooking, onIdentityChange, onContinueToPayment, onPaymentChange, onContinueToReview, onAuthorize, onBackFromBooking, onRevalidationComplete, onChangePayment, onExecutionChange, onReturnToReview, onViewBooking, onViewTrip, onBackToConfirmation, onDone }) {
  const [isHowToTestOpen, setIsHowToTestOpen] = useState(false);

  useEffect(() => {
    if (!isHowToTestOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsHowToTestOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isHowToTestOpen]);

  return (
    <div className="scout-page">
      <RotatingBackground />

      <div className="scout-video-overlay" />
      <button
        type="button"
        className="scout-brand"
        onClick={onHardReset}
        aria-label="SCOUT home — start over"
      >
        SCOUT
      </button>
      <button
        type="button"
        className="scout-new-trip"
        onClick={onNewTrip}
      >
        New Trip
      </button>
      <button
        type="button"
        className="scout-how-to-test-trigger"
        onClick={() => setIsHowToTestOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isHowToTestOpen}
      >
        How to test
      </button>

      <main className="scout-main">
        {bookingSession && bookingExperienceOpen ? (
          bookingSession.stage === "CONFIRMED" && bookingSession.view === BOOKING_VIEWS.TRIP_DETAILS ? (
            <TripDetails session={bookingSession} onBack={onBackToConfirmation} />
          ) : bookingSession.stage === "CONFIRMED" ? (
            <BookingConfirmation
              session={bookingSession}
              onViewTrip={onViewTrip}
              onDone={onDone}
            />
          ) : bookingSession.stage === "AGENT_EXECUTION" ? (
            <AgentExecution
              session={bookingSession}
              onExecutionChange={onExecutionChange}
              onReturnToReview={onReturnToReview}
              onViewBooking={onViewBooking}
            />
          ) : bookingSession.stage === "REVIEW_AUTHORIZE" ? (
            <ReviewAuthorize
              session={bookingSession}
              onAuthorize={onAuthorize}
              onChangePayment={onChangePayment}
              onBack={onBackFromBooking}
            />
          ) : bookingSession.stage === "PAYMENT" ? (
            <PaymentMethod
              session={bookingSession}
              onPaymentChange={onPaymentChange}
              onContinue={onContinueToReview}
              onBack={onBackFromBooking}
            />
          ) : bookingSession.stage === "TRAVELLER_IDENTITY" ? (
            <TravellerIdentity
              session={bookingSession}
              onIdentityChange={onIdentityChange}
              onContinue={onContinueToPayment}
              onBack={onBackFromBooking}
            />
          ) : (
            <BookingReview
              session={bookingSession}
              onContinue={onContinueBooking}
              onBack={onBackFromBooking}
              onRevalidationComplete={onRevalidationComplete}
            />
          )
        ) : (
          <div className="scout-hero">
            <section className="scout-intro">
              <h1>So... what's the plan?</h1>
              <p>
                <strong>
                  <span className="scout-mobile-support-line">
                    SCOUT, your AI travel bestie who helps
                  </span>{" "}
                  <span className="scout-mobile-support-line">
                    you travel better, not just travel cheaper.
                  </span>
                </strong>
              </p>
            </section>

            <ScoutChat />
          </div>
        )}
      </main>
      <footer className="scout-footer">
        <div>
          <span className="scout-footer-desktop-copyright">
            © 2026 Fred Wong. All rights reserved. · {" "}
          </span>
          <span className="scout-footer-mobile-copyright">
            © 2026 Fred Wong · {" "}
          </span>
          <a href="mailto:fredwongstudio@gmail.com">fredwongstudio@gmail.com</a>
        </div>
        <div>Sandbox flight inventory · Booking and payment are simulated</div>
      </footer>
      {isHowToTestOpen && (
        <div
          className="scout-how-to-test-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsHowToTestOpen(false);
          }}
        >
          <section
            className="scout-how-to-test-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="scout-how-to-test-title"
          >
            <button
              type="button"
              className="scout-how-to-test-close"
              onClick={() => setIsHowToTestOpen(false)}
              aria-label="Close how to test"
            >
              ×
            </button>
            <h2 id="scout-how-to-test-title">How to test SCOUT</h2>
            <p>
              SCOUT is an Agentic Commerce Flight Booking Prototype exploring how an AI travel agent can take you from conversation to booking.
            </p>
            <h3>Try the full journey</h3>
            <p>
              Start with a return flight from Singapore to Tokyo and let SCOUT guide you through the rest.
            </p>
            <p>Feel free to try other destinations and airports too.</p>
            <p className="scout-how-to-test-note">
              Sandbox flight inventory · Booking and payment are simulated.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [sessionKey, setSessionKey] = useState(0);
  const [bookingSession, setBookingSession] = useState(null);
  const [bookingExperienceOpen, setBookingExperienceOpen] = useState(false);
  const {
    runtime,
    resetConversation,
    hardResetConversation,
    appendLocalAssistantMessage,
  } = useScoutRuntime();

  const hardResetHome = () => {
    setBookingSession(null);
    setBookingExperienceOpen(false);
    hardResetConversation();
  };

  const startNewTrip = async () => {
    setBookingSession(null);
    setBookingExperienceOpen(false);

    try {
      await resetConversation();
    } catch (error) {
      console.error("SCOUT reset failed:", error);
    }

    setSessionKey((key) => key + 1);
  };

  const selectFlight = ({ summary, itinerary }) => {
    setBookingSession((current) =>
      selectBookingItinerary(current, { summary, itinerary }),
    );
    setBookingExperienceOpen(true);
  };

  const continueBooking = () => {
    setBookingSession((current) => current && {
      ...current,
      stage: "TRAVELLER_IDENTITY",
    });
  };

  const completeRevalidation = () => {
    setBookingSession((current) => current && {
      ...current,
      offerRevalidated: true,
    });
  };

  const backFromBooking = () => {
    if (bookingSession?.stage === "REVIEW") {
      setBookingExperienceOpen(false);
      return;
    }

    setBookingSession((current) => {
      const previousStage = getPreviousPreAuthorizationStage(current?.stage);

      return previousStage
        ? { ...current, stage: previousStage }
        : current;
    });
  };

  const updateIdentity = (identity) => {
    setBookingSession((current) => current && {
      ...current,
      identity,
      authorization: createAuthorizationState(),
      execution: createExecutionState(),
    });
  };

  const continueToPayment = () => {
    setBookingSession((current) => {
      if (!current || !isIdentityReadyForPayment(current.identity, current.itinerary?.travellers)) {
        return current;
      }

      return {
        ...current,
        stage: "PAYMENT",
      };
    });
  };

  const updatePayment = (method) => {
    setBookingSession((current) => current && {
      ...current,
      payment: createSelectedPayment(method),
      authorization: createAuthorizationState(),
      execution: createExecutionState(),
    });
  };

  const continueToReview = () => {
    setBookingSession((current) => {
      if (!current || !isPaymentSelected(current.payment)) {
        return current;
      }

      return {
        ...current,
        stage: "REVIEW_AUTHORIZE",
      };
    });
  };

  const authorizeBooking = () => {
    setBookingSession((current) => {
      if (!current || !isPaymentSelected(current.payment)) {
        return current;
      }

      return {
        ...current,
        authorization: createAuthorizedState(current),
        execution: createExecutionState(),
        stage: "AGENT_EXECUTION",
      };
    });
  };

  const changePaymentMethod = () => {
    setBookingSession((current) => current && {
      ...current,
      stage: "PAYMENT",
      authorization: createAuthorizationState(),
      execution: createExecutionState(),
    });
  };

  const updateExecution = (execution) => {
    setBookingSession((current) => current && {
      ...current,
      execution,
    });
  };

  const returnToReview = () => {
    setBookingSession((current) => current && {
      ...current,
      stage: "REVIEW_AUTHORIZE",
      authorization: createAuthorizationState(),
      execution: createExecutionState(),
    });
  };

  const viewBooking = () => {
    setBookingSession((current) => {
      if (!canViewBooking(current)) {
        return current;
      }

      return {
        ...current,
        stage: "CONFIRMED",
        view: BOOKING_VIEWS.CONFIRMATION,
      };
    });
  };

  const viewTrip = () => {
    setBookingSession((current) => {
      if (!canViewTrip(current)) {
        return current;
      }

      return {
        ...current,
        view: BOOKING_VIEWS.TRIP_DETAILS,
      };
    });
  };

  const backToConfirmation = () => {
    setBookingSession((current) => current && {
      ...current,
      view: BOOKING_VIEWS.CONFIRMATION,
    });
  };

  const finishBooking = () => {
    if (
      bookingSession?.stage === "CONFIRMED" &&
      !bookingSession.completionAcknowledged
    ) {
      appendLocalAssistantMessage(
        createCompletionAcknowledgement(bookingSession),
      );
      setBookingSession((current) => current && {
        ...current,
        completionAcknowledged: true,
      });
    }

    setBookingExperienceOpen(false);
  };

  return (
    <AssistantRuntimeProvider
      key={sessionKey}
      runtime={runtime}
    >
      <ScoutDataUI onSelectFlight={selectFlight} />
      <TooltipProvider>
        <ScoutShell
          onHardReset={hardResetHome}
          onNewTrip={startNewTrip}
          bookingSession={bookingSession}
          bookingExperienceOpen={bookingExperienceOpen}
          onContinueBooking={continueBooking}
          onIdentityChange={updateIdentity}
          onContinueToPayment={continueToPayment}
          onPaymentChange={updatePayment}
          onContinueToReview={continueToReview}
          onAuthorize={authorizeBooking}
          onBackFromBooking={backFromBooking}
          onRevalidationComplete={completeRevalidation}
          onChangePayment={changePaymentMethod}
          onExecutionChange={updateExecution}
          onReturnToReview={returnToReview}
          onViewBooking={viewBooking}
          onViewTrip={viewTrip}
          onBackToConfirmation={backToConfirmation}
          onDone={finishBooking}
        />
      </TooltipProvider>
    </AssistantRuntimeProvider>
  );
}
