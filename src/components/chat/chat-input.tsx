"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/hooks/use-voice-input";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  locale?: string;
  ttsEnabled: boolean;
  onTtsToggle: (enabled: boolean) => void;
}

type InputMode = "voice" | "text";

export function ChatInput({
  onSend,
  disabled,
  locale,
  ttsEnabled,
  onTtsToggle,
}: ChatInputProps) {
  const t = useTranslations("chat");
  const [mode, setMode] = useState<InputMode>("voice");
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleVoiceResult = useCallback(
    (transcript: string) => {
      if (transcript.trim() && !disabled) {
        onSend(transcript.trim());
      }
    },
    [onSend, disabled]
  );

  const {
    isListening,
    isSupported: isVoiceSupported,
    transcript,
    toggleListening,
    stopListening,
  } = useVoiceInput({
    locale,
    onResult: handleVoiceResult,
  });

  useEffect(() => {
    if (mode === "text" && isListening) {
      stopListening();
    }
  }, [mode, isListening, stopListening]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleInput() {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-card p-4">
      {mode === "voice" ? (
        <div className="flex flex-col items-center gap-3">
          {transcript && (
            <p className="animate-pulse text-sm text-muted-foreground">
              {transcript}
            </p>
          )}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMode("text")}
              title={t("switchToText")}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <span className="text-sm font-semibold">Aa</span>
            </button>

            <button
              type="button"
              onClick={toggleListening}
              disabled={disabled || !isVoiceSupported}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full transition-all",
                isListening
                  ? "scale-110 animate-pulse bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
                (disabled || !isVoiceSupported) &&
                  "cursor-not-allowed opacity-50"
              )}
            >
              {isListening ? (
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                  <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => onTtsToggle(!ttsEnabled)}
              title={ttsEnabled ? t("ttsOn") : t("ttsOff")}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                ttsEnabled
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {ttsEnabled ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                  />
                </svg>
              )}
            </button>
          </div>

          {!isVoiceSupported && (
            <p className="text-xs text-muted-foreground">
              {t("voiceNotSupported")}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setMode("voice")}
            title={t("switchToVoice")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={t("placeholder")}
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19V5m0 0l-7 7m7-7l7 7"
              />
            </svg>
          </button>
        </div>
      )}
    </form>
  );
}
