import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export interface AIConfig {
  provider: string;
  model: string;
  ollamaUrl?: string;
}

export type AITask = "chat" | "extract";

const OPENAI_TASK_MODELS: Record<AITask, string> = {
  chat: "gpt-4.1-nano",
  extract: "gpt-4.1-nano",
};

/**
 * Validates that an Ollama URL does not point to internal network addresses.
 * Blocks: private IPs, link-local, loopback (except localhost:11434), metadata services.
 */
export function isAllowedOllamaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

    const hostname = parsed.hostname.replace(/^\[|\]$/g, ""); // strip IPv6 brackets

    // Allow localhost (common Ollama setup)
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;

    // Block private/internal networks
    if (
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^169\.254\./.test(hostname) ||
      hostname === "0.0.0.0" ||
      hostname === "[::]" ||
      hostname === "::1" ||
      hostname === "metadata.google.internal"
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function getOllamaModel(config: AIConfig): LanguageModel {
  const ollamaUrl = config.ollamaUrl || "http://localhost:11434";
  if (!isAllowedOllamaUrl(ollamaUrl)) {
    throw new Error("Ollama URL blocked: internal network addresses are not allowed");
  }
  const baseURL = `${ollamaUrl}/v1`;
  const ollama = createOpenAI({ baseURL, apiKey: "ollama" });
  return ollama.chat(config.model);
}

export function getModelForTask(config: AIConfig, task: AITask): LanguageModel {
  if (config.provider === "ollama") return getOllamaModel(config);

  const openai = createOpenAI({});
  return openai(OPENAI_TASK_MODELS[task]);
}
