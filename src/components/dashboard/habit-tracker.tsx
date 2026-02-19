"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn, getLast30Days } from "@/lib/utils";
import { format } from "date-fns";

interface HabitTrackerProps {
  activeDates: string[];
}

export function HabitTracker({ activeDates }: HabitTrackerProps) {
  const t = useTranslations("dashboard");
  const last30Days = getLast30Days();
  const todayStr = last30Days[last30Days.length - 1];
  const activeDateSet = new Set(
    activeDates.map((d) => format(new Date(d), "yyyy-MM-dd"))
  );

  const days = last30Days.map((dateStr) => ({
    date: dateStr,
    label: format(new Date(dateStr), "d"),
    dayOfWeek: format(new Date(dateStr), "EEE"),
    active: activeDateSet.has(dateStr),
    isToday: dateStr === todayStr,
  }));

  const activeCount = days.filter((d) => d.active).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("habitTitle")}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {t("habitDays", { active: activeCount })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-10 gap-1.5">
          {days.map((day) => (
            <div
              key={day.date}
              title={`${day.date}${day.active ? " - Active" : ""}`}
              className={cn(
                "flex h-8 w-full items-center justify-center rounded-md text-xs font-medium transition-colors",
                day.active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
                day.isToday && !day.active && "ring-2 ring-primary/30"
              )}
            >
              {day.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
