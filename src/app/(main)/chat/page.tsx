"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { getGreeting } from "@/lib/utils";

function getTextFromMessage(message: UIMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export default function ChatPage() {
  const conversationIdRef = useRef<string | null>(null);
  const [greeting] = useState(getGreeting());
  const initializedRef = useRef(false);

  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          conversationId: conversationIdRef.current,
        }),
      })
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
    onFinish: () => {
      fetch("/api/conversations?limit=1")
        .then((r) => r.json())
        .then((data) => {
          if (data?.[0]?.id) {
            conversationIdRef.current = data[0].id;
          }
        })
        .catch(() => {});
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      sendMessage({ text: `${greeting}! I'm ready for my daily reflection.` });
    }
  }, []);

  function handleSend(content: string) {
    sendMessage({ text: content });
  }

  const displayMessages = messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: getTextFromMessage(m),
  }));

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 items-center border-b border-border px-6">
        <h1 className="text-lg font-semibold text-foreground">
          Daily Reflection
        </h1>
        <button
          onClick={() => {
            conversationIdRef.current = null;
            window.location.reload();
          }}
          className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          New conversation
        </button>
      </header>

      {error && (
        <div className="mx-4 mt-4 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message || "Something went wrong. Please try again."}
        </div>
      )}

      <MessageList messages={displayMessages} isStreaming={isStreaming} />
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
