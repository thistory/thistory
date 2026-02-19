"use client";

import { useCallback, useRef, useState, useEffect } from "react";

interface UseVoiceOutputOptions {
  locale?: string;
  rate?: number;
  pitch?: number;
}

interface UseVoiceOutputReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  speak: (text: string) => void;
  stop: () => void;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}

function mapLocale(locale: string | undefined): string {
  if (!locale) return "en-US";
  if (locale === "ko") return "ko-KR";
  if (locale === "en") return "en-US";
  return locale;
}

export function useVoiceOutput({
  locale,
  rate = 1,
  pitch = 1,
}: UseVoiceOutputOptions = {}): UseVoiceOutputReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window);

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !enabled || !text.trim()) return;

      const synth = window.speechSynthesis;
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = mapLocale(locale);
      utterance.rate = rate;
      utterance.pitch = pitch;

      const langCode = mapLocale(locale);
      const voices = synth.getVoices();
      const matchingVoice = voices.find(
        (voice) =>
          voice.lang.startsWith(langCode.split("-")[0]) ||
          voice.lang === langCode
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      synth.speak(utterance);
    },
    [isSupported, enabled, locale, rate, pitch]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
    enabled,
    setEnabled,
  };
}
