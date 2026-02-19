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

function pickBestVoice(
  voices: SpeechSynthesisVoice[],
  langCode: string
): SpeechSynthesisVoice | null {
  const lang = langCode.split("-")[0];
  const matching = voices.filter(
    (v) => v.lang === langCode || v.lang.startsWith(lang)
  );
  if (matching.length === 0) return null;

  const premium = matching.find(
    (v) =>
      v.name.includes("Premium") ||
      v.name.includes("Enhanced") ||
      v.name.includes("Natural") ||
      v.name.includes("Yuna") ||
      v.name.includes("Google")
  );
  return premium ?? matching.find((v) => !v.localService) ?? matching[0];
}

function splitIntoChunks(text: string, maxLen = 120): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?。\n])\s*/);

  let current = "";
  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLen && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
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

      const langCode = mapLocale(locale);
      const voice = pickBestVoice(synth.getVoices(), langCode);
      const chunks = splitIntoChunks(text);

      let currentIndex = 0;
      const speakNext = () => {
        if (currentIndex >= chunks.length) {
          setIsSpeaking(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[currentIndex]);
        utterance.lang = langCode;
        utterance.rate = rate;
        utterance.pitch = pitch;
        if (voice) utterance.voice = voice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          currentIndex++;
          speakNext();
        };
        utterance.onerror = () => {
          currentIndex++;
          speakNext();
        };

        utteranceRef.current = utterance;
        synth.speak(utterance);
      };

      speakNext();
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
