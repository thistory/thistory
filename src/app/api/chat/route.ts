import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSystemPrompt } from "@/lib/ai/prompts";
import {
  extractInsights,
  generateConversationSummary,
  formatConversationForExtraction,
} from "@/lib/ai/extract";
import { updateStreak } from "@/lib/streak";

export const maxDuration = 30;

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const { messages, conversationId } = await request.json();

  let convId = conversationId;

  if (!convId) {
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: "Daily reflection",
      },
    });
    convId = conversation.id;
  }

  const userMessage = messages[messages.length - 1];
  if (userMessage?.role === "user") {
    await prisma.message.create({
      data: {
        conversationId: convId,
        role: "USER",
        content: userMessage.content,
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
    userName: session.user.name || undefined,
    previousInsights: recentInsights.map((i) => i.content),
  });

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages,
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
            extractInsights(conversationText).catch(() => null),
            generateConversationSummary(conversationText).catch(() => null),
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
      } catch {
        console.error("Post-processing failed (non-blocking)");
      }
    },
  });

  return result.toDataStreamResponse({
    headers: {
      "X-Conversation-Id": convId,
    },
  });
}
