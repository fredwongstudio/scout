import assert from "node:assert/strict";

import {
  hardResetLocalConversation,
  resetActiveConversation,
} from "./runtime.js";

let activeConversationId = "conversation_trip_a";
let request;

await resetActiveConversation({
  conversationId: activeConversationId,
  clearConversationId() {
    activeConversationId = null;
  },
  async fetchImpl(url, options) {
    request = { url, options };

    return {
      ok: true
    };
  }
});

assert.equal(request.url, "/api/reset");
assert.equal(request.options.method, "POST");
assert.equal(
  request.options.headers["Content-Type"],
  "application/json"
);
assert.deepEqual(
  JSON.parse(request.options.body),
  { conversationId: "conversation_trip_a" }
);
assert.equal(activeConversationId, null);

console.log(
  "PASS: New Trip sends and clears the active chat-v2 conversation ID"
);

let localConversationId = "conversation_booking_a";
let localThreadResetCount = 0;

hardResetLocalConversation({
  runtime: {
    thread: {
      reset() {
        localThreadResetCount += 1;
      },
    },
  },
  clearConversationId() {
    localConversationId = null;
  },
});

assert.equal(localThreadResetCount, 1);
assert.equal(localConversationId, null);

console.log(
  "PASS: Logo hard reset clears only local assistant-ui thread and conversation ID"
);
