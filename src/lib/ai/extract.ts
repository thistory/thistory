import { generateObject, generateText } from "ai";
import { z } from "zod";
import { EXTRACTION_PROMPT, SUMMARY_PROMPT } from "./prompts";
import { getModel, type AIConfig } from "./provider";

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
  aiConfig?: AIConfig
): Promise<ExtractedInsights> {
  const { object } = await generateObject({
    model: getModel(aiConfig),
    schema: InsightSchema,
    system: EXTRACTION_PROMPT,
    prompt: conversationText,
  });

  return object;
}

export async function generateConversationSummary(
  conversationText: string,
  aiConfig?: AIConfig
): Promise<string> {
  const { text } = await generateText({
    model: getModel(aiConfig),
    system: SUMMARY_PROMPT,
    prompt: conversationText,
    maxOutputTokens: 50,
  });

  return text;
}

export function formatConversationForExtraction(
  messages: { role: string; content: string }[]
): string {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");
}
