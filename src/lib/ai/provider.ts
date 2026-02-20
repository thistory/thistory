import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export interface AIConfig {
  provider: string;
  model: string;
  ollamaUrl?: string;
}

export type AITask = "chat" | "extract" | "summary";

const DEFAULT_CONFIG: AIConfig = {
  provider: "openai",
  model: "gpt-4.1-mini",
};

// Task-specific models for OpenAI (optimized for quality & cost)
const OPENAI_TASK_MODELS: Record<AITask, string> = {
  chat: "gpt-4.1-mini",     // Best multi-turn conversation quality
  extract: "gpt-4o-mini",   // Reliable structured output (JSON Schema)
  summary: "gpt-4.1-nano",  // Simple task, cheapest model sufficient
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

export function getModelForTask(config: AIConfig, task: AITask): LanguageModel {
  if (config.provider !== "openai") return getModel(config);

  const openai = createOpenAI({});
  return openai(OPENAI_TASK_MODELS[task]);
}
