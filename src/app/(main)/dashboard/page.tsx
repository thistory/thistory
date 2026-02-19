import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StreakCard } from "@/components/dashboard/streak-card";
import { GoalsList } from "@/components/dashboard/goals-list";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { InsightsSummary } from "@/components/dashboard/insights-summary";
import { HabitTracker } from "@/components/dashboard/habit-tracker";
import { format } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  const t = await getTranslations("dashboard");

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [streak, conversations, insights] = await Promise.all([
    prisma.streak.findUnique({ where: { userId } }),
    prisma.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, createdAt: true },
    }),
    prisma.insight.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const today = format(new Date(), "yyyy-MM-dd");
  const lastConvDate = streak?.lastConversationDate
    ? format(new Date(streak.lastConversationDate), "yyyy-MM-dd")
    : null;
  const isActiveToday = lastConvDate === today;

  const conversationDates = conversations.map((c) =>
    c.createdAt.toISOString()
  );

  const insightCounts = ["GOAL", "CONCERN", "ACTION", "HABIT"].map((type) => ({
    type,
    count: insights.filter((i) => i.type === type).length,
  }));

  const goals = insights
    .filter((i) => i.type === "GOAL")
    .map((i) => ({
      ...i,
      tags: i.tags as string[],
      createdAt: i.createdAt.toISOString(),
    }));

  const recentInsights = insights.slice(0, 5).map((i) => ({
    id: i.id,
    type: i.type,
    content: i.content,
  }));

  return (
    <div className="h-full overflow-auto">
      <header className="flex h-14 items-center border-b border-border px-6">
        <h1 className="text-lg font-semibold text-foreground">{t("title")}</h1>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <StreakCard
          currentStreak={streak?.currentStreak || 0}
          longestStreak={streak?.longestStreak || 0}
          isActiveToday={isActiveToday}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <ActivityChart conversationDates={conversationDates} />
          <HabitTracker activeDates={conversationDates} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <GoalsList insights={goals} />
          <InsightsSummary
            counts={insightCounts}
            recentInsights={recentInsights}
          />
        </div>
      </div>
    </div>
  );
}
