import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export interface AIConfig {
  provider: string;
  model: string;
  ollamaUrl?: string;
}

const DEFAULT_CONFIG: AIConfig = {
  provider: "openai",
  model: "gpt-4o-mini",
};

export function getModel(config?: AIConfig): LanguageModel {
  const { provider, model, ollamaUrl } = config ?? DEFAULT_CONFIG;

  if (provider === "ollama") {
    const baseURL = `${ollamaUrl || "http://localhost:11434"}/v1`;
    const ollama = createOpenAI({ baseURL, apiKey: "ollama" });
    // Ollama only supports Chat Completions API, not OpenAI Responses API
    return ollama.chat(model);
  }

  const openai = createOpenAI({});
  return openai(model);
}
