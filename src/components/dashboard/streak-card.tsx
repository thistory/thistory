"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  isActiveToday?: boolean;
}

export function StreakCard({
  currentStreak,
  longestStreak,
  isActiveToday = false,
}: StreakCardProps) {
  const t = useTranslations("dashboard");

  return (
    <Card className={cn(isActiveToday && "border-primary/30 bg-primary/5")}>
      <CardContent>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl text-2xl",
              isActiveToday ? "bg-primary/15" : "bg-muted"
            )}
          >
            <span role="img" aria-label="fire">
              {currentStreak > 0 ? "🔥" : "💤"}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {currentStreak}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("dayStreak", { count: currentStreak })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("longestStreak", { count: longestStreak })}
            </p>
          </div>
          {!isActiveToday && currentStreak > 0 && (
            <div className="rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              {t("checkInToday")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
