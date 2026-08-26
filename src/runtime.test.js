import assert from "node:assert/strict";

import {
  hardResetLocalConversation,
  resetActiveConversation,
} from "./runtime.js";

let activeConversationId = "conversation_trip_a";
let resetThreadCount = 0;
let resetFetchCalls = 0;

resetActiveConversation({
  runtime: {
    thread: {
      reset() {
        resetThreadCount += 1;
      },
    },
  },
  clearConversationId() {
    activeConversationId = null;
  },
  fetchImpl() {
    resetFetchCalls += 1;
  },
});

assert.equal(resetThreadCount, 1);
assert.equal(resetFetchCalls, 0);
assert.equal(activeConversationId, null);

console.log(
  "PASS: New Trip clears the local thread and active chat-v2 conversation ID"
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
