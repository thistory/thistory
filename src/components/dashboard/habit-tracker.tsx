"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, subDays, startOfDay } from "date-fns";

interface HabitTrackerProps {
  activeDates: string[];
}

export function HabitTracker({ activeDates }: HabitTrackerProps) {
  const today = startOfDay(new Date());
  const activeDateSet = new Set(
    activeDates.map((d) => format(new Date(d), "yyyy-MM-dd"))
  );

  const days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i);
    const dateStr = format(date, "yyyy-MM-dd");
    return {
      date: dateStr,
      label: format(date, "d"),
      dayOfWeek: format(date, "EEE"),
      active: activeDateSet.has(dateStr),
      isToday: dateStr === format(today, "yyyy-MM-dd"),
    };
  });

  const activeCount = days.filter((d) => d.active).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Habit Tracker</CardTitle>
          <span className="text-sm text-muted-foreground">
            {activeCount}/30 days
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
