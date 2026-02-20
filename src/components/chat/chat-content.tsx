"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { useVoiceOutput } from "@/hooks/use-voice-output";

function getTextFromMessage(message: UIMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function dbMessagesToUIMessages(
  messages: Array<{ id: string; role: string; content: string }>
): UIMessage[] {
  return messages
    .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
    .map((m) => ({
      id: m.id,
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      parts: [{ type: "text" as const, text: m.content }],
      createdAt: new Date(),
    }));
}

interface ChatContentProps {
  locale: string;
  greeting: string;
  existingConversation: {
    id: string;
    title: string | null;
    messages: Array<{ id: string; role: string; content: string }>;
  } | null;
  onNewConversation: () => void;
}

export function ChatContent({
  locale,
  greeting,
  existingConversation,
  onNewConversation,
}: ChatContentProps) {
  const conversationIdRef = useRef<string | null>(
    existingConversation?.id ?? null
  );
  const t = useTranslations("chat");
  const initializedRef = useRef(false);
  const lastSpokenIdRef = useRef<string | null>(null);

  const {
    speak,
    stop: stopSpeaking,
    enabled: ttsEnabled,
    setEnabled: setTtsEnabled,
    isSupported: ttsSupported,
  } = useVoiceOutput({ locale });

  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          conversationId: conversationIdRef.current,
          locale,
        }),
      })
  );

  const initialMessages = existingConversation
    ? dbMessagesToUIMessages(existingConversation.messages)
    : undefined;

  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: initialMessages,
    onFinish: () => {
      fetch("/api/conversations?limit=1")
        .then((r) => r.json())
        .then((data) => {
          if (data?.[0]?.id) {
            conversationIdRef.current = data[0].id;
          }
        })
        .catch((err) => {
          console.error("Failed to fetch conversation ID:", err);
        });
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Only send greeting for new conversations (no existing messages)
  useEffect(() => {
    if (!initializedRef.current && !existingConversation) {
      initializedRef.current = true;
      sendMessage({ text: greeting });
    }
  }, []);

  // Auto-speak assistant messages when streaming completes
  useEffect(() => {
    if (!ttsEnabled || !ttsSupported) return;
    const lastMsg = messages[messages.length - 1];
    if (
      lastMsg &&
      lastMsg.role === "assistant" &&
      lastMsg.id !== lastSpokenIdRef.current &&
      status !== "streaming" &&
      status !== "submitted"
    ) {
      const text = getTextFromMessage(lastMsg);
      if (text) {
        speak(text);
        lastSpokenIdRef.current = lastMsg.id;
      }
    }
  }, [messages, status, ttsEnabled, ttsSupported, speak]);

  function handleSend(content: string) {
    stopSpeaking();
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
          {t("title")}
        </h1>
        <button
          onClick={onNewConversation}
          className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("newConversation")}
        </button>
      </header>

      {error && (
        <div className="mx-4 mt-4 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {(() => {
            try {
              const parsed = JSON.parse(error.message);
              return parsed.error || t("errorMessage");
            } catch {
              return error.message || t("errorMessage");
            }
          })()}
        </div>
      )}

      <MessageList messages={displayMessages} isStreaming={isStreaming} />
      <ChatInput
        onSend={handleSend}
        disabled={isStreaming}
        locale={locale}
        ttsEnabled={ttsEnabled}
        onTtsToggle={setTtsEnabled}
      />
    </div>
  );
}
