"use client";

import { useEffect, useRef } from "react";
import { MessageBubble, TypingIndicator } from "./message-bubble";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isStreaming?: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
        />
      ))}
      {isStreaming && messages[messages.length - 1]?.role === "user" && (
        <TypingIndicator />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
