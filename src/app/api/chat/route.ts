import { streamText, convertToModelMessages } from "ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemPrompt } from "@/lib/ai/prompts";
import { getModel, type AIConfig } from "@/lib/ai/provider";
import {
  extractInsights,
  generateConversationSummary,
  formatConversationForExtraction,
} from "@/lib/ai/extract";
import { updateStreak } from "@/lib/streak";
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

  const body = await request.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid request data", { status: 400 });
  }
  const { messages, conversationId, locale } = parsed.data;

  let convId = conversationId ?? undefined;

  if (!convId) {
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: "Daily reflection",
      },
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
      data: {
        conversationId: convId!,
        role: "USER",
        content: textContent,
      },
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
    previousInsights: recentInsights.map((i) => i.content),
    locale,
  });

  // Pass original body.messages to convertToModelMessages — Zod validated structure,
  // but AI SDK needs its own UIMessage types which are broader than our schema
  const modelMessages = await convertToModelMessages(body.messages);

  if (aiConfig.provider === "openai" && !process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY is not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let result;
  try {
    result = streamText({
      model: getModel(aiConfig),
      system: systemPrompt,
      messages: modelMessages,
      async onFinish({ text }) {
      await prisma.message.create({
        data: {
          conversationId: convId,
          role: "ASSISTANT",
          content: text,
        },
      });

      try {
        const allMessages = await prisma.message.findMany({
          where: { conversationId: convId },
          orderBy: { createdAt: "asc" },
        });

        if (allMessages.length >= 4) {
          const conversationText = formatConversationForExtraction(
            allMessages.map((m) => ({
              role: m.role.toLowerCase(),
              content: m.content,
            }))
          );

          const [extracted, summary] = await Promise.all([
            extractInsights(conversationText, aiConfig).catch(() => null),
            generateConversationSummary(conversationText, aiConfig).catch(
              () => null
            ),
          ]);

          if (extracted) {
            const existingInsights = await prisma.insight.findMany({
              where: { conversationId: convId },
              select: { content: true },
            });
            const existingContents = new Set(
              existingInsights.map((i) => i.content)
            );

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
          }

          if (summary) {
            await prisma.conversation.update({
              where: { id: convId },
              data: { summary, title: summary },
            });
          }
        }

        await updateStreak(userId);
      } catch (error) {
        console.error("Post-processing failed (non-blocking):", error);
      }
    },
  });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI provider error";
    console.error("streamText failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  return result.toUIMessageStreamResponse({
    headers: {
      "X-Conversation-Id": convId,
    },
  });
}
