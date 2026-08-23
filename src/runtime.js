import { useLocalRuntime } from "@assistant-ui/react";

export const useScoutRuntime = () => {
  let conversationId = null;

  return useLocalRuntime({
    async run({ messages, abortSignal }) {
      const lastUserMessage = [...messages]
        .reverse()
        .find((message) => message.role === "user");

      const text = lastUserMessage?.content
        ?.filter((part) => part.type === "text")
        ?.map((part) => part.text)
        ?.join("\n")
        ?.trim();

      if (!text) {
        return {
          content: [{ type: "text", text: "" }]
        };
      }

      const response = await fetch("/api/chat-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          conversationId
        }),
        signal: abortSignal
      });

      if (!response.ok) {
        throw new Error(
          `SCOUT API error: ${response.status}`
        );
      }

      const data = await response.json();

      conversationId =
        data.conversationId || conversationId;

      const content = [
        {
          type: "text",
          text:
            data.reply ||
            "SCOUT did not return a response."
        }
      ];

      for (const uiPart of data.ui || []) {
        if (
          uiPart &&
          uiPart.type === "data" &&
          uiPart.name
        ) {
          content.push({
            type: "data",
            name: uiPart.name,
            data: uiPart.data
          });
        }
      }

      return {
        content
      };
    }
  });
};
