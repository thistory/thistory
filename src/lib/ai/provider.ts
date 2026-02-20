import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export interface AIConfig {
  provider: string;
  model: string;
  ollamaUrl?: string;
}

export type AITask = "chat" | "extract";

const OPENAI_TASK_MODELS: Record<AITask, string> = {
  chat: "gpt-4.1-mini",
  extract: "gpt-4o-mini",
};

function getOllamaModel(config: AIConfig): LanguageModel {
  const baseURL = `${config.ollamaUrl || "http://localhost:11434"}/v1`;
  const ollama = createOpenAI({ baseURL, apiKey: "ollama" });
  return ollama.chat(config.model);
}

export function getModelForTask(config: AIConfig, task: AITask): LanguageModel {
  if (config.provider === "ollama") return getOllamaModel(config);

  const openai = createOpenAI({});
  return openai(OPENAI_TASK_MODELS[task]);
}
