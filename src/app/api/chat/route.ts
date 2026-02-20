import { streamText, convertToModelMessages } from "ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemPrompt, buildInsightsContext } from "@/lib/ai/prompts";
import { getModelForTask, type AIConfig } from "@/lib/ai/provider";
import {
  extractInsights,
  formatConversationForExtraction,
} from "@/lib/ai/extract";
import { updateStreak } from "@/lib/streak";
import { logger } from "@/lib/logger";
import { chatLimiter } from "@/lib/rate-limit";
import { z } from "zod";

export const maxDuration = 30;

const chatSchema = z.object({
  messages: z.array(z.record(z.string(), z.unknown())).min(1),
  conversationId: z.string().nullable().optional(),
  locale: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const rl = chatLimiter.check(userId);
  if (!rl.success) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please slow down." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 60000) / 1000)),
        },
      }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, aiProvider: true, aiModel: true, ollamaUrl: true },
  });

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  const aiConfig: AIConfig = {
    provider: user.aiProvider,
    model: user.aiModel,
    ollamaUrl: user.ollamaUrl,
  };

  if (aiConfig.provider === "openai" && !process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY is not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await request.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid request data", { status: 400 });
  }
  const { messages, conversationId, locale } = parsed.data;

  let convId = conversationId ?? undefined;

  if (convId) {
    const existing = await prisma.conversation.findFirst({
      where: { id: convId, userId },
      select: { id: true },
    });
    if (!existing) {
      return new Response("Conversation not found", { status: 404 });
    }
  } else {
    const conversation = await prisma.conversation.create({
      data: { userId, title: "Daily story" },
    });
    convId = conversation.id;
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === "user") {
    const content = typeof lastMessage.content === "string" ? lastMessage.content : "";
    const parts = Array.isArray(lastMessage.parts) ? lastMessage.parts : [];
    const textContent =
      content ||
      parts
        .filter(
          (p: Record<string, unknown>) =>
            p.type === "text" && typeof p.text === "string"
        )
        .map((p: Record<string, unknown>) => p.text as string)
        .join("") ||
      "";

    await prisma.message.create({
      data: { conversationId: convId, role: "USER", content: textContent },
    });
  }

  const recentInsights = await prisma.insight.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { content: true },
  });

  const systemPrompt = getSystemPrompt({
    userName: user.name || undefined,
    locale,
  });

  const modelMessages = await convertToModelMessages(body.messages);

  // Inject insights as a separate context message to isolate from system prompt
  const insightsContext = buildInsightsContext(recentInsights.map((i) => i.content));
  if (insightsContext && modelMessages.length > 0) {
    modelMessages.unshift({ role: "user", content: insightsContext });
    modelMessages.unshift({ role: "assistant", content: "Understood, I'll keep these themes in mind." });
  }

  let result;
  try {
    result = streamText({
      model: getModelForTask(aiConfig, "chat"),
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.7,
      frequencyPenalty: 0.3,
      maxOutputTokens: 300,
      async onFinish({ text }) {
        await prisma.message.create({
          data: { conversationId: convId, role: "ASSISTANT", content: text },
        });

        try {
          const allMessages = await prisma.message.findMany({
            where: { conversationId: convId },
            orderBy: { createdAt: "asc" },
          });

          const messageCount = allMessages.length;
          const isClosingResponse =
            messageCount >= 8 &&
            /내일|tomorrow|마무리|focus on|한 가지|one thing|좋은 하루|good night|잘 자|rest well/i.test(text);

          if (messageCount >= 12 || isClosingResponse) {
            const conversationText = formatConversationForExtraction(
              allMessages.map((m) => ({
                role: m.role.toLowerCase(),
                content: m.content,
              }))
            );

            const extracted = await extractInsights(conversationText, aiConfig).catch(() => null);

            if (extracted) {
              const existingInsights = await prisma.insight.findMany({
                where: { conversationId: convId },
                select: { content: true },
              });
              const existingContents = new Set(existingInsights.map((i) => i.content));
              const newInsights = extracted.insights.filter(
                (i) => !existingContents.has(i.content)
              );

              if (newInsights.length > 0) {
                await prisma.insight.createMany({
                  data: newInsights.map((insight) => ({
                    conversationId: convId,
                    userId,
                    type: insight.type.toUpperCase() as
                      | "GOAL"
                      | "CONCERN"
                      | "ACTION"
                      | "HABIT",
                    content: insight.content,
                    tags: insight.tags,
                  })),
                });
              }

              if (extracted.summary) {
                await prisma.conversation.update({
                  where: { id: convId },
                  data: { summary: extracted.summary, title: extracted.summary },
                });
              }
            }
          }

          await updateStreak(userId);
        } catch (error) {
          logger.error("Post-processing failed (non-blocking)", error);
        }
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI provider error";
    logger.error("streamText failed", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  return result.toUIMessageStreamResponse({
    headers: { "X-Conversation-Id": convId },
  });
}
