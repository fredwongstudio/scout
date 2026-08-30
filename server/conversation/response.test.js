const test = require("node:test");
const assert = require("node:assert/strict");

const {
  formatConversationResponse,
} = require("./response");

test("formats the provider flight search failure message", () => {
  assert.equal(
    formatConversationResponse({ action: "SEARCH_UNAVAILABLE" }),
    "I couldn’t find suitable flights this time.",
  );
});

test("formats the no-usable-flight result as the same recovery message", () => {
  assert.equal(
    formatConversationResponse({
      action: "SEARCH_COMPLETED",
      results: { itineraries: [] },
      ui: [],
    }),
    "I couldn’t find suitable flights this time.",
  );
});
