const { normalizeFlights } = require("./flight-normalizer");
const { createTripManager } = require("./trip/manager");

const { buildTripCandidate } = require("./conversation/pipeline");

const { searchFlights } = require("./flight/search");

const {
  getOrCreateConversation,
  resetConversation
} = require("./conversation/registry");

const {
  formatConversationResponse
} = require("./conversation/response");

const {
  buildChatV2Response
} = require("./conversation/chat-v2-response");
const { config } = require("./config/env");
const OpenAI = require("openai");
const { z } = require("zod");
const { zodTextFormat } = require("openai/helpers/zod");
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const isPublicDeployment = process.env.NODE_ENV === "production";

if (!isPublicDeployment) {
  app.use(
    express.static(
      path.resolve(__dirname, "../SCOUT-react-ui/dist")
    )
  );
}

const PORT = 3000;
const openai = new OpenAI();

const travelExtractionSchema = z.object({
  origin: z.string().nullable(),
  destination: z.string().nullable(),
  trip_length_days: z.number().nullable(),
  depart_date: z.string().nullable(),
  return_date: z.string().nullable(),
  traveller_mentions: z.array(
    z.object({
      relation: z.string(),
      category: z.enum(["adult", "child", "infant"]),
      age: z.number().nullable()
    })
  )
});


// Conversation state is intentionally reset when the server starts.
// This prevents previous test conversations from leaking into a new session.
const chatHistory = [];
const tripManager = createTripManager();

// Tracks whether SCOUT has explicitly asked who is travelling.
// This is separate from assuming the user is travelling.
let passengerQuestionAsked = false;

const travelState = {
  origin: null,
  destination: null,
  depart: null,
  returnDate: null,
  tripLengthDays: null,

  passengers: {
    confirmed: false,
    adults: 0,
    children: 0,
    infants: 0,
    childAges: []
  }
};




async function extractTravelState(message, history) {
  const response = await openai.responses.parse({
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content:
          "Extract travel information from the conversation. " +
          "Use the conversation context to understand what the user's latest message refers to. " +
          "Pay particular attention to the immediately preceding SCOUT question. " +

          "If SCOUT asks where the user wants to go and the user replies with a city, " +
          "treat that city as the destination. " +

          "If SCOUT asks where the user is flying from and the user replies with a city, " +
          "treat that city as the origin. " +

          "Do not assign a city to origin or destination based solely on the city name; " +
          "use the conversational context. " +

          "Use null when information is unknown. Do not guess. " +

          "If the user gives an explicit return date, put it in return_date. " +
          "If they only give a trip length, return_date should be null. " +

          "For traveller_mentions, describe only travellers explicitly mentioned " +
          "or clearly established by the conversation. " +

          "Each traveller mention must contain relation, category and age. " +
          "Valid categories are adult, child and infant. " +
          "Use age null when an age is not known. " +

          "The user themselves should be represented as relation 'self' and category 'adult'. " +
          "Assume the user is travelling unless they explicitly say they are booking " +
          "for other people only. Never ask whether the user is travelling. " +

          "Recognise natural family descriptions such as wife, husband, father, mother, " +
          "parents, son, daughter, kid, baby and infant. " +

          "A wife, husband, father, mother, parent or partner is an adult. " +
          "A son, daughter, kid or child is a child when their age is known to be under 12. " +
          "A baby or infant is an infant. " +

          "Do not calculate passenger totals. " +
          "Do not invent passenger counts. " +
          "Do not convert traveller descriptions into adult, child or infant totals. " +

          "If a child is mentioned without an age, preserve that traveller as a child " +
          "with age null. Do not search for flights until the child's age is known. " +

          "If no traveller information has been provided yet, return traveller_mentions as an empty array."
      },
      ...history,
      {
        role: "user",
        content: message
      }
    ],
    text: {
      format: zodTextFormat(travelExtractionSchema, "travel_extraction")
    }
  });

  return response.output_parsed;
}

function addTotalPrices(flights, travellerCount) {
  return (Array.isArray(flights) ? flights : []).map((flight) => {
    const perPerson = Number(flight.totalPricePerPerson);
    const fallback = Number(flight.price || 0) + Number(flight.tax || 0);
    const price = Number.isFinite(perPerson) ? perPerson : fallback;

    return {
      ...flight,
      totalPricePerPerson: price,
      travellerCount,
      totalTripPrice: price * travellerCount
    };
  });
}

async function recommendFlights(outbound, inbound) {
  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content:
          "You are SCOUT, a practical travel-obsessed friend. " +
          "Use only the supplied flight results. Recommend the best-value options. " +
          "Show airline, flight number, route, departure/arrival, duration, stops, " +
          "price per person, total price, and baggage when available. " +
          "Do not invent information. Keep it concise and pick a clear best-value option."
      },
      {
        role: "user",
        content: JSON.stringify({ outbound, inbound })
      }
    ]
  });

  return response.output_text;
}


function normalizeAirportCode(value) {
  const raw = String(value || "").trim();
  const key = raw.toLowerCase();

  const codes = {
    singapore: "SIN",
    "singapore (sin)": "SIN",
    sin: "SIN",
    bangkok: "BKK",
    "bangkok (bkk)": "BKK",
    bkk: "BKK"
  };

  return codes[key] || raw.toUpperCase();
}

if (!isPublicDeployment) {
app.post("/api/trip-candidate", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const candidate = await buildTripCandidate(
      message,
      []
    );

    res.json({
      candidate
    });
  } catch (error) {
    console.error(
      "Trip Candidate error:",
      error.message
    );

    res.status(500).json({
      error: "Trip Candidate generation failed"
    });
  }
});

app.get("/api/debug-response", (req, res) => {
  const result = {
    action: "REQUEST_CONFIRMATION",
    state: {
      origin: "SIN",
      destination: "BKK",
      departureDate: "2026-12-20",
      returnDate: "2026-12-22",
      passengers: {
        adults: 2,
        children: 0,
        infants: 0,
        childAges: []
      }
    }
  };

  res.json({
    formatted: formatConversationResponse(result)
  });
});
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat-v2", async (req, res) => {
  try {
    const {
      message,
      conversationId
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required."
      });
    }

    const {
      id,
      conversation
    } = getOrCreateConversation(
      conversationId
    );

    const result =
      await conversation.handleMessage(
        message,
        []
      );

    console.log(
      "[SCOUT DEBUG] CHAT RESULT:",
      JSON.stringify(result, null, 2)
    );

    const reply =
      formatConversationResponse(result);

    res.json(
      buildChatV2Response({
        conversationId: id,
        result,
        reply
      })
    );

  } catch (error) {
    console.error(
      "Chat v2 error:",
      error.message
    );

    res.status(500).json({
      error: "SCOUT chat failed"
    });
  }
});

if (!isPublicDeployment) {
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const extracted = await extractTravelState(message, chatHistory);

    const tripCandidate = {
      origin: extracted.origin,
      destination: extracted.destination,
      departureDate: extracted.depart_date,
      returnDate: extracted.return_date,
      tripLengthDays: extracted.trip_length_days,
      passengers: {
        adults: extracted.traveller_mentions.filter(
          (traveller) => traveller.category === "adult"
        ).length,
        children: extracted.traveller_mentions.filter(
          (traveller) => traveller.category === "child"
        ).length,
        infants: extracted.traveller_mentions.filter(
          (traveller) => traveller.category === "infant"
        ).length,
        childAges: extracted.traveller_mentions
          .filter(
            (traveller) =>
              traveller.category === "child" &&
              Number.isFinite(Number(traveller.age))
          )
          .map((traveller) => Number(traveller.age))
      }
    };

    const newTripState = tripManager.update(tripCandidate);

    console.log(
      "SCOUT Trip Manager state:",
      JSON.stringify(newTripState)
    );

    if (extracted.origin) travelState.origin = extracted.origin;
    if (extracted.destination) travelState.destination = extracted.destination;

    function normalizeDate(value) {
      if (!value) return null;
      const raw = String(value).trim();

      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

      const match = raw.match(/^(\d{1,2})\s+([A-Za-z]{3,9})$/);
      if (!match) return null;

      const months = {
        jan: 0, january: 0, feb: 1, february: 1,
        mar: 2, march: 2, apr: 3, april: 3, may: 4,
        jun: 5, june: 5, jul: 6, july: 6,
        aug: 7, august: 7, sep: 8, september: 8,
        oct: 9, october: 9, nov: 10, november: 10,
        dec: 11, december: 11
      };

      const month = months[match[2].toLowerCase()];
      if (month === undefined) return null;

      const year = new Date().getFullYear();
      const day = Number(match[1]);
      const date = new Date(year, month, day);

      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day
      ) return null;

      return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    if (extracted.depart_date) {
      travelState.depart = normalizeDate(extracted.depart_date);
    }

    // Explicit return date always wins over trip length.
    if (extracted.return_date) {
      travelState.returnDate = normalizeDate(extracted.return_date);
    }

    if (extracted.trip_length_days) {
      travelState.tripLengthDays = Number(extracted.trip_length_days);
    }

    // Build passenger state from traveller descriptions.
    // The user is assumed to be travelling unless explicitly excluded.
    if (Array.isArray(extracted.traveller_mentions)) {

      const travellers = extracted.traveller_mentions;

      travelState.passengers.confirmed = true;
      travelState.passengers.adults = travellers.filter(
        (traveller) => traveller.category === "adult"
      ).length;

      travelState.passengers.children = travellers.filter(
        (traveller) => traveller.category === "child"
      ).length;

      travelState.passengers.infants = travellers.filter(
        (traveller) => traveller.category === "infant"
      ).length;

      travelState.passengers.childAges = travellers
        .filter(
          (traveller) =>
            traveller.category === "child" &&
            Number.isFinite(Number(traveller.age))
        )
        .map((traveller) => Number(traveller.age));
    }

    // A child without a known age is not ready for flight search.
    const mentionsChildWithoutAge =
      Array.isArray(extracted.traveller_mentions) &&
      extracted.traveller_mentions.some(
        (traveller) =>
          traveller.category === "child" &&
          !Number.isFinite(Number(traveller.age))
      );

    if (!travelState.returnDate && travelState.depart && travelState.tripLengthDays) {
      const date = new Date(`${travelState.depart}T00:00:00`);
      date.setDate(date.getDate() + travelState.tripLengthDays);
      travelState.returnDate =
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    const passengerTotals =
      travelState.passengers.adults +
      travelState.passengers.children +
      travelState.passengers.infants;

    const passengersReady =
      passengerQuestionAsked &&
      passengerTotals > 0 &&
      !mentionsChildWithoutAge;

    const readyForFlightSearch =
      Boolean(travelState.origin) &&
      Boolean(travelState.destination) &&
      Boolean(travelState.depart) &&
      Boolean(travelState.returnDate) &&
      passengersReady;

    console.log("SCOUT state:", JSON.stringify(travelState));

    const searchOrigin =
      normalizeAirportCode(travelState.origin);

    const searchDestination =
      normalizeAirportCode(travelState.destination);

    let nextMissingDetail = null;

    if (!travelState.origin) {
      nextMissingDetail = "origin";
    } else if (!travelState.destination) {
      nextMissingDetail = "destination";
    } else if (!travelState.depart) {
      nextMissingDetail = "departure date";
    } else if (!travelState.returnDate) {
      nextMissingDetail = "return date or trip length";
    } else if (mentionsChildWithoutAge) {

      nextMissingDetail = "the age of the child travelling";

    } else if (!passengerQuestionAsked) {

      passengerQuestionAsked = true;

      nextMissingDetail = "who is travelling with you";

    }
    let reply;
    let outbound = [];
    let inbound = [];

    if (!readyForFlightSearch) {
      const response = await openai.responses.create({
        model: "gpt-5-mini",
        input: [
          {
            role: "system",
            content:
              "You are SCOUT, the user's Singaporean travel bestie who knows travel ridiculously well. " +
              "Sound warm, casual, playful, confident and genuinely helpful. " +
              "Use natural Singaporean expressions such as 'Wah!', 'shiok', 'nice', 'gotcha', 'can' and 'lemme check' when they fit, but never force Singlish or overdo it. " +
              "React naturally to what the user says before moving the conversation forward. " +
              "Never sound like a form, customer-service bot or travel agent. " +
              "Be concise, conversational and slightly cheeky. " +
              "When appropriate, have an opinion and tell the user what you would personally choose. " +
              "Do not repeat information the user has already provided. " +
              "When the user provides a missing detail, acknowledge it briefly and move directly to the next missing detail. Do not restate the route, dates, passenger details or other information already established unless it genuinely adds useful context. " +
              "Never use parenthetical explanations such as '(your origin)', '(departure date)', '(return date)' or similar labels. Speak naturally instead. " +
              "Never say 'Please give', 'Please provide', 'Please enter', 'Specify' or similar form-like instructions. " +
              "Turn the missing detail into a natural question a close travel friend would ask. For example, for a departure date say 'When are you thinking of going?' rather than 'Please give the date.' " +
              "The ONLY missing information you should ask for right now is: " + nextMissingDetail + ". " +
              "Ask for ONLY that one thing. Never ask for any other missing information in the same response. " +
              "When the missing detail is who is travelling, NEVER mention adult, child, infant, passenger counts or ages as a list. Simply ask naturally who is coming along, such as 'Who's coming along?' or 'Who are you travelling with?' " +
              "Let the user describe the travelling group naturally. Do not make them translate their answer into airline categories. " +
              "If the user mentions family members without making it clear whether they themselves are travelling, ask a natural clarification such as 'That includes you too, right?' " +
              "Required: origin, destination, departure date, return date or trip length, " +
              "adults, children, infants. Do not ask about hotels, itinerary or sightseeing. " +
              "Cabin class is optional. " +
              "If the user says they are travelling with a son or daughter but does not give the child's age, " +
              "ask for the child's age before searching. Never assume child versus infant from the word son/daughter alone. " +
              "When asking for a child's age, speak naturally based on the relationship already mentioned. For example, if the user says 'my son', ask 'How old's your son?' rather than 'What is the child's age?' "
          },
          ...chatHistory,
          { role: "user", content: message }
        ]
      });
      reply = response.output_text;
    } else {
      const travellerCount =
        travelState.passengers.adults +
        travelState.passengers.children +
        travelState.passengers.infants;

      console.log("SCOUT flight search:", JSON.stringify(travelState));

      const makeSearchUrl = (origin, destination, depart) =>
        `http://localhost:${PORT}/api/flights?` +
        new URLSearchParams({
          origin,
          destination,
          depart,
          adults: String(travelState.passengers.adults),
          children: String(travelState.passengers.children),
          infants: String(travelState.passengers.infants)
        });

      const [outboundResponse, inboundResponse] = await Promise.all([
        fetch(makeSearchUrl(
          searchOrigin,
          searchDestination,
          travelState.depart
        )),
        fetch(makeSearchUrl(
          searchDestination,
          searchOrigin,
          travelState.returnDate
        ))
      ]);

      const outboundRaw = await outboundResponse.json();
      const inboundRaw = await inboundResponse.json();

      outbound = addTotalPrices(outboundRaw, travellerCount);
      inbound = addTotalPrices(inboundRaw, travellerCount);

      if (!outbound.length || !inbound.length) {
        reply =
          "I've got your trip details, but I couldn't find a usable flight combination right now.";
      } else {
        reply = await recommendFlights(
          outbound.slice(0, 8),
          inbound.slice(0, 8)
        );
      }
    }

    chatHistory.push(
      { role: "user", content: message },
      { role: "assistant", content: reply }
    );

    res.json({
      reply,
      flights: {
        outbound: outbound.slice(0, 8),
        inbound: inbound.slice(0, 8)
      }
    });
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({ error: "SCOUT chat failed" });
  }
});

app.post("/api/reset", (req, res) => {
  const conversationId =
    req.body?.conversationId;

  if (conversationId) {
    resetConversation(conversationId);
  }

  chatHistory.length = 0;
  passengerQuestionAsked = false;

  travelState.origin = null;
  travelState.destination = null;
  travelState.depart = null;
  travelState.returnDate = null;
  travelState.tripLengthDays = null;
  travelState.passengers = {
    confirmed: false,
    adults: 0,
    children: 0,
    infants: 0,
    childAges: []
  };

  console.log("SCOUT conversation reset.");

  res.json({ ok: true });
});

app.get("/api/flights", async (req, res) => {
  try {
    const {
      origin,
      destination,
      depart,
      adults = 1,
      children = 0,
      infants = 0,
      currency = "USD"
    } = req.query;

    const response = await fetch(
      `${config.atlasSearchBaseUrl}/search.do`,
      {
        method: "POST",
        headers: {
          "x-atlas-client-id": config.atlasClientId,
          "x-atlas-client-secret": config.atlasClientSecret,
          "Content-Type": "application/json",
          "Accept-Encoding": "gzip"
        },
        body: JSON.stringify({
          cid: config.atlasClientId,
          tripType: "1",
          adultNum: Number(adults),
          childNum: Number(children),
          infantNum: Number(infants),
          fromCity: origin,
          toCity: destination,
          fromDate: depart.replaceAll("-", ""),
          currency,
          requestSource: "scout-prototype"
        })
      }
    );

    const data = await response.json();

res.status(response.ok ? 200 : response.status).json(
normalizeFlights(data)
);

  } catch (error) {
    console.error("Atlas search error:", error.message);

    res.status(500).json({
      error: "Atlas flight search failed"
    });
  }
});
}

app.listen(PORT, () => {
  console.log(`SCOUT Atlas server running on http://localhost:${PORT}`);
});
