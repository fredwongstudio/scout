const { zodTextFormat } = require("openai/helpers/zod");
const { openai } = require("../config/openai");
const { tripCandidateSchema } = require("./interpreter-schema");

async function interpretConversation(message, history = []) {
  const response = await openai.responses.parse({
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content:
          "Interpret the user's travel conversation and extract only information explicitly stated or clearly established by context. " +
          "Use the immediately preceding assistant question to resolve ambiguous short answers such as city names or dates. " +
          "Correct obvious spelling mistakes, typos and natural conversational misspellings in travel locations when the intended location is unambiguous. " +
          "For example, interpret Singapoer as Singapore when the user clearly means Singapore. " +
          "Return the corrected human-readable location name, not an airport or provider code. " +
          "Do not invent a location when the intended location is genuinely ambiguous. " +
          "Do not guess missing information. " +
          "Use null when a field is unknown. " +
          "Do not search for flights. " +
          "Do not decide whether the trip is ready for search. " +
          "Do not calculate passenger totals. " +
          "For travellerMentions, preserve people described by the user. " +
          "IMPORTANT: travellerMentions must contain only people whose travel participation is explicitly stated or clearly established by the user's words. " +
          "Never infer the user as a traveller merely because they are speaking to SCOUT. " +
          "For example, if the user says Singapore in response to Where are you flying from?, travellerMentions MUST be an empty array. " +
          "If the user says Just me, travellerMentions should contain the user as an adult. " +
          "If the user says Me and my wife, travellerMentions should contain the user and their wife as adults. " +
          "Do not use the fact that the user is the person speaking as evidence that they are travelling. " +
          "A wife, husband, father, mother, parent or partner is an adult. " +
          "A son, daughter, kid or child is a child when their age is known to be under 12. " +
          "A baby or infant is an infant. " +
          "If a child is mentioned without a known age, preserve the child with age null. " +
          "Do not invent an age. " +
          "Recognise natural conversational descriptions such as wife, husband, son, daughter, parents, kids, baby and infant. " +
          "If the user gives an explicit return date, use returnDate. " +
          "If the user gives only a trip length, use tripLengthDays and leave returnDate null. " +
          "Use ROUND_TRIP when a return journey is established and ONE_WAY when a one-way journey is established. " +
          "If trip type is not established, use null."
      },
      ...history,
      {
        role: "user",
        content: message
      }
    ],
    text: {
      format: zodTextFormat(
        tripCandidateSchema,
        "trip_candidate"
      )
    }
  });

  return response.output_parsed;
}

module.exports = {
  interpretConversation
};
