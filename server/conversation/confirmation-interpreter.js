const { zodTextFormat } = require("openai/helpers/zod");
const { openai } = require("../config/openai");
const {
  confirmationIntentSchema
} = require("./confirmation-schema");

const affirmativeConfirmations = new Set([
  "yes",
  "yep",
  "yeah",
  "go ahead",
  "find flights",
  "search flights",
  "book it"
]);

const CONFIRMATION_REQUEST_TIMEOUT_MS = 12000;

function normalizeConfirmationMessage(message) {
  return String(message || "")
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");
}

async function interpretConfirmation(
  message,
  tripState,
  history = []
) {
  if (
    affirmativeConfirmations.has(
      normalizeConfirmationMessage(message)
    )
  ) {
    return {
      intent: "CONFIRM"
    };
  }

  const startedAt = Date.now();

  console.log("[SCOUT] confirmation request started", {
    messageLength: message.length,
    historyTurns: history.length
  });

  try {
    const response = await openai.responses.parse(
      {
        model: "gpt-5-mini",
        input: [
          {
            role: "system",
            content:
              "Determine the user's intent regarding confirmation of the supplied trip summary. " +
              "Return CONFIRM only when the user clearly accepts or confirms the trip details. " +
              "Return CORRECT when the user indicates something is wrong, wants to change a detail, " +
              "or supplies information that contradicts the supplied trip state. " +
              "Return UNKNOWN when the response is ambiguous, unrelated, or does not clearly confirm or correct the trip. " +
              "Do not make changes to the trip state. " +
              "Do not search for flights. " +
              "Do not infer confirmation merely because the user provides additional information. " +
              "The user must clearly accept the trip summary for CONFIRM. " +
              "Use the supplied trip state and conversation history as context."
          },
          {
            role: "user",
            content: JSON.stringify({
              tripState,
              history,
              message
            })
          }
        ],
        text: {
          format: zodTextFormat(
            confirmationIntentSchema,
            "confirmation_intent"
          )
        }
      },
      {
        timeout: CONFIRMATION_REQUEST_TIMEOUT_MS
      }
    );

    console.log("[SCOUT] confirmation request completed", {
      durationMs: Date.now() - startedAt
    });

    return response.output_parsed;
  } catch (error) {
    console.warn("[SCOUT] confirmation request failed", {
      durationMs: Date.now() - startedAt,
      failureType: error?.name || "UnknownError"
    });

    throw error;
  }
}

module.exports = {
  CONFIRMATION_REQUEST_TIMEOUT_MS,
  interpretConfirmation
};
