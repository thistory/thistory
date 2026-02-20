"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ChatContent } from "@/components/chat/chat-content";

interface ConversationData {
  id: string;
  title: string | null;
  messages: Array<{ id: string; role: string; content: string }>;
}

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export default function ChatPage() {
  const t = useTranslations("chat");
  const tg = useTranslations("greeting");
  const locale = useLocale();
  const [greetingKey] = useState(getGreetingKey());
  const [loading, setLoading] = useState(true);
  const [existingConversation, setExistingConversation] =
    useState<ConversationData | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetch("/api/conversations/latest")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ConversationData | null) => {
        if (data?.id && data.messages.length > 0) {
          setExistingConversation(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleNewConversation = useCallback(() => {
    setExistingConversation(null);
    setChatKey((k) => k + 1);
  }, []);

  const greeting = `${tg(greetingKey)}! ${t("initialMessage")}`;

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-14 items-center border-b border-border px-6">
          <h1 className="text-lg font-semibold text-foreground">
            {t("title")}
          </h1>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <ChatContent
      key={chatKey}
      locale={locale}
      greeting={greeting}
      existingConversation={existingConversation}
      onNewConversation={handleNewConversation}
    />
  );
}
