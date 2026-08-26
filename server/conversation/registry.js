const {
  createConversationOrchestrator
} = require("./orchestrator");
const { randomUUID } = require("crypto");

const conversations = new Map();

function createConversation() {
  const id = `conversation_${randomUUID()}`;

  const conversation =
    createConversationOrchestrator();

  conversations.set(id, conversation);

  return {
    id,
    conversation
  };
}

function getConversation(id) {
  return conversations.get(id) || null;
}

function getOrCreateConversation(id) {
  if (id) {
    const existing =
      getConversation(id);

    if (existing) {
      return {
        id,
        conversation: existing
      };
    }
  }

  return createConversation();
}

function resetConversation(id) {
  const entry =
    getConversation(id);

  if (!entry) {
    return false;
  }

  entry.reset();

  return true;
}

module.exports = {
  createConversation,
  getConversation,
  getOrCreateConversation,
  resetConversation
};
