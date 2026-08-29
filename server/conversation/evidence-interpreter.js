const { zodTextFormat } = require("openai/helpers/zod");

const { openai } = require("../config/openai");

const {
  conversationEvidenceSchema
} = require("./evidence-schema");

const EVIDENCE_REQUEST_TIMEOUT_MS = 12000;

async function interpretConversationEvidence(
  message,
  history = []
) {
  const startedAt = Date.now();

  console.log("[SCOUT] evidence request started", {
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
              "Interpret only the new information contained in the user's latest message. " +
              "Extract evidence explicitly stated by the user or clearly established by the immediately preceding assistant question. " +
              "Do not reconstruct the entire trip from previous context. " +
              "Do not repeat facts merely because they exist in conversation history. " +
              "Return null for travel fields that are not newly established by the latest message. " +
              "Return an empty travellerMentions array when the latest message contains no traveller evidence. " +
              "Do not infer the user as a traveller unless the user explicitly indicates that they are travelling. " +
              "For example, 'Just me' means one adult traveller. " +
              "Interpret family relationships from the grammar and stated travel participation, not from a fixed assumption about the speaker. " +
              "For example, 'I am going with my parents' establishes the speaker plus two adult parents; 'my parents are going' establishes only two adult parents; and 'I am travelling with one of my parents' establishes the speaker plus one adult parent. " +
              "'My parents and my son' establishes two adult parents and one child, but does not establish that the speaker is travelling unless the wording says so. " +
              "A vague phrase such as 'going with family' does not establish a passenger count. " +
              "Represent each established traveller separately in travellerMentions, including both parents when plural parents are explicitly travelling. " +
              "These relationship-based composition signals are provisional until the traveller confirms the trip summary before search; do not invent ages or other passenger details. " +
              "Do not calculate passenger totals. " +
              "Do not decide whether the trip is ready for search. " +
              "Do not search for flights. " +
              "Correct obvious spelling mistakes when the intended travel location is unambiguous. " +
              "Return human-readable location names, not airport codes."
          },
          ...history,
          {
            role: "user",
            content: message
          }
        ],
        text: {
          format: zodTextFormat(
            conversationEvidenceSchema,
            "conversation_evidence"
          )
        }
      },
      {
        timeout: EVIDENCE_REQUEST_TIMEOUT_MS
      }
    );

    console.log("[SCOUT] evidence request completed", {
      durationMs: Date.now() - startedAt
    });

    return response.output_parsed;
  } catch (error) {
    console.warn("[SCOUT] evidence request failed", {
      durationMs: Date.now() - startedAt,
      failureType: error?.name || "UnknownError"
    });

    throw error;
  }
}

module.exports = {
  EVIDENCE_REQUEST_TIMEOUT_MS,
  interpretConversationEvidence
};
