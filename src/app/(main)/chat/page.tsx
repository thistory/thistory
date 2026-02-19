"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { getGreeting } from "@/lib/utils";

export default function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [greeting] = useState(getGreeting());

  const { messages, append, status, error } = useChat({
    api: "/api/chat",
    body: { conversationId },
    onResponse(response) {
      const newConvId = response.headers.get("X-Conversation-Id");
      if (newConvId && !conversationId) {
        setConversationId(newConvId);
      }
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (messages.length === 0 && !conversationId) {
      append({
        role: "user",
        content: `${greeting}! I'm ready for my daily reflection.`,
      });
    }
  }, []);

  function handleSend(content: string) {
    append({ role: "user", content });
  }

  const displayMessages = messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 items-center border-b border-border px-6">
        <h1 className="text-lg font-semibold text-foreground">
          Daily Reflection
        </h1>
        {conversationId && (
          <button
            onClick={() => {
              setConversationId(null);
              window.location.reload();
            }}
            className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            New conversation
          </button>
        )}
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
