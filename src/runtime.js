import { useRef } from "react";
import { useLocalRuntime } from "@assistant-ui/react";

export function resetActiveConversation({
  runtime,
  clearConversationId,
}) {
  hardResetLocalConversation({
    runtime,
    clearConversationId,
  });
}

export function hardResetLocalConversation({
  runtime,
  clearConversationId,
}) {
  runtime.thread.reset();
  clearConversationId();
}

export const useScoutRuntime = () => {
  const conversationIdRef = useRef(null);

  const clearConversationId = () => {
    conversationIdRef.current = null;
  };

  const runtime = useLocalRuntime({
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

      console.log(
        "[SCOUT UI DEBUG] runtime.run:",
        JSON.stringify({
          text,
          conversationId: conversationIdRef.current
        })
      );

      const response = await fetch("/api/chat-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          conversationId: conversationIdRef.current
        }),
        signal: abortSignal
      });

      if (!response.ok) {
        throw new Error(
          `SCOUT API error: ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "[SCOUT UI DEBUG] API response:",
        JSON.stringify(data, null, 2)
      );

      conversationIdRef.current =
        data.conversationId || conversationIdRef.current;

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

  return {
    runtime,
    appendLocalAssistantMessage(text) {
      runtime.thread.append({
        role: "assistant",
        content: [{ type: "text", text }],
      });
    },
    resetConversation() {
      return resetActiveConversation({
        runtime,
        clearConversationId
      });
    },
    hardResetConversation() {
      hardResetLocalConversation({
        runtime,
        clearConversationId,
      });
    }
  };
};
