import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations("conversation");

  if (!session?.user?.id) {
    redirect("/login");
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      insights: true,
    },
  });

  if (!conversation || conversation.userId !== session.user.id) {
    notFound();
  }

  const typeVariants: Record<string, "goal" | "concern" | "action" | "habit"> =
    {
      GOAL: "goal",
      CONCERN: "concern",
      ACTION: "action",
      HABIT: "habit",
    };

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 items-center gap-3 border-b border-border px-6">
        <Link
          href="/chat"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-sm font-semibold text-foreground">
            {conversation.title || t("defaultTitle")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {formatDate(conversation.createdAt)}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map((message) => (
          <div key={message.id}>
            <MessageBubble
              role={message.role.toLowerCase() as "user" | "assistant"}
              content={message.content}
            />
            <p className="mt-1 text-xs text-muted-foreground px-2">
              {formatTime(message.createdAt)}
            </p>
          </div>
        ))}

        {conversation.insights.length > 0 && (
          <div className="mt-8 rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {t("extractedInsights")}
            </h3>
            <div className="space-y-2">
              {conversation.insights.map((insight) => (
                <div key={insight.id} className="flex items-start gap-2">
                  <Badge
                    variant={typeVariants[insight.type] || "default"}
                    className="mt-0.5 shrink-0"
                  >
                    {insight.type.toLowerCase()}
                  </Badge>
                  <span className="text-sm text-foreground">
                    {insight.content}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
