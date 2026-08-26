const {
  normalizeRoundTripFlights
} = require("./round-trip-normalizer");

const {
  config
} = require("../config/env");

async function searchAtlasFlights({
  origin,
  destination,
  depart,
  returnDate,
  adults = 1,
  children = 0,
  infants = 0,
  currency = "USD"
}) {
  if (!origin) {
    throw new Error("Atlas search requires origin.");
  }

  if (!destination) {
    throw new Error(
      "Atlas search requires destination."
    );
  }

  if (!depart) {
    throw new Error(
      "Atlas search requires departure date."
    );
  }

  if (!returnDate) {
    throw new Error(
      "Atlas round-trip search requires return date."
    );
  }

  const endpoint =
    `${config.atlasSearchBaseUrl}/search.do`;

  const route = {
    origin,
    destination,
    depart,
    returnDate,
    adults: Number(adults),
    children: Number(children),
    infants: Number(infants)
  };

  let response;
  let data;
  let responseBodyWasJson = null;

  try {
    response = await fetch(
      endpoint,
      {
        method: "POST",

        headers: {
          "x-atlas-client-id":
            config.atlasClientId,

          "x-atlas-client-secret":
            config.atlasClientSecret,

          "Content-Type":
            "application/json",

          "Accept": "application/json",

          "Accept-Encoding": "gzip"
        },

        body: JSON.stringify({
          cid: config.atlasClientId,

          tripType: "2",

          adultNum: Number(adults),
          childNum: Number(children),
          infantNum: Number(infants),

          fromCity: origin,
          fromAirport: "",

          toCity: destination,
          toAirport: "",

          fromDate:
            depart.replaceAll("-", ""),

          retDate:
            returnDate.replaceAll("-", ""),

          currency,

          requestSource:
            "scout-prototype"
        })
      }
    );

    data = await response.json();
    responseBodyWasJson = true;

    if (!response.ok) {
      throw new Error(
        `Atlas round-trip search failed with status ${response.status}`
      );
    }

    if (
      data &&
      data.status !== undefined &&
      Number(data.status) !== 0
    ) {
      throw new Error(
        data.msg ||
        "Atlas round-trip search returned an error."
      );
    }

    console.log(
      "[SCOUT DEBUG] ATLAS ROUND-TRIP ROUTING:",
      JSON.stringify(
        data?.routings?.[0],
        null,
        2
      )
    );

    return normalizeRoundTripFlights(data);
  } catch (error) {
    if (response && responseBodyWasJson === null) {
      responseBodyWasJson = false;
    }

    console.error("[SCOUT] Atlas search failed", {
      endpoint,
      httpStatus: response?.status ?? null,
      atlasStatus:
        data?.status ?? data?.code ?? null,
      atlasMessage:
        typeof (data?.msg || data?.message) === "string"
          ? (data.msg || data.message)
          : null,
      responseBodyWasJson,
      errorName: error?.name || null,
      errorCode: error?.code || error?.cause?.code || null,
      route
    });

    throw error;
  }
}

module.exports = {
  searchAtlasFlights
};
