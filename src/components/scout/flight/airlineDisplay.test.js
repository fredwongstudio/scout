import assert from "node:assert/strict";
import { formatAirlineDisplay } from "./airlineDisplay.js";

assert.equal(
  formatAirlineDisplay({
    airlineName: "Singapore Airlines",
    airlineCode: "SQ",
  }),
  "Singapore Airlines (SQ)"
);

assert.equal(
  `${formatAirlineDisplay({
    airlineName: "Scoot",
    airlineCode: "TR",
  })} · TR874`,
  "Scoot (TR) · TR874"
);

assert.equal(
  `${formatAirlineDisplay({ airlineCode: "XX" })} · XX123`,
  "XX · XX123"
);
assert.equal(formatAirlineDisplay(), "Airline unavailable");

console.log("PASS: airline display preserves a code-only fallback");
