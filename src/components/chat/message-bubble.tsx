"use client";

import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border text-card-foreground rounded-bl-md"
        )}
      >
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
