function buildChatV2Response({
  conversationId,
  result,
  reply
}) {
  return {
    conversationId,
    action: result.action,
    state: result.state,
    reply,
    ui: result.ui || []
  };
}

module.exports = {
  buildChatV2Response
};
