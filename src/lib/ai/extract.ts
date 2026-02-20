import { generateObject } from "ai";
import { z } from "zod";
import { EXTRACTION_PROMPT } from "./prompts";
import { getModelForTask, type AIConfig } from "./provider";

const InsightSchema = z.object({
  insights: z.array(
    z.object({
      type: z.enum(["goal", "concern", "action", "habit"]),
      content: z.string(),
      tags: z.array(z.string()),
    })
  ),
  summary: z.string(),
});

export type ExtractedInsights = z.infer<typeof InsightSchema>;

export async function extractInsights(
  conversationText: string,
  aiConfig: AIConfig
): Promise<ExtractedInsights> {
  const { object } = await generateObject({
    model: getModelForTask(aiConfig, "extract"),
    schema: InsightSchema,
    system: EXTRACTION_PROMPT,
    prompt: conversationText,
    temperature: 0.1,
  });

  return object;
}

export function formatConversationForExtraction(
  messages: { role: string; content: string }[]
): string {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");
}
