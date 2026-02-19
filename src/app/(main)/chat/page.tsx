"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { useVoiceOutput } from "@/hooks/use-voice-output";

function getTextFromMessage(message: UIMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export default function ChatPage() {
  const router = useRouter();
  const conversationIdRef = useRef<string | null>(null);
  const t = useTranslations("chat");
  const tg = useTranslations("greeting");
  const locale = useLocale();
  const [greetingKey] = useState(getGreetingKey());
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
        .catch((err) => {
          console.error("Failed to fetch conversation ID:", err);
        });
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      sendMessage({ text: `${tg(greetingKey)}! ${t("initialMessage")}` });
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
          onClick={() => {
            conversationIdRef.current = null;
            router.refresh();
          }}
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
