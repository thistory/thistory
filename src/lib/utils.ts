import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return format(d, "MMM d, yyyy");
}

export function formatRelativeDate(
  date: Date | string,
  labels?: { today: string; yesterday: string }
): string {
  const d = new Date(date);
  if (isToday(d)) return labels?.today ?? "Today";
  if (isYesterday(d)) return labels?.yesterday ?? "Yesterday";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), "h:mm a");
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function calculateStreakFromDates(
  dates: Date[],
  today: Date = new Date()
): { currentStreak: number; longestStreak: number } {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const uniqueDays = [
    ...new Set(dates.map((d) => format(d, "yyyy-MM-dd"))),
  ].sort();

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const todayStr = format(today, "yyyy-MM-dd");
  const yesterdayStr = format(
    new Date(today.getTime() - 86400000),
    "yyyy-MM-dd"
  );

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays =
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  const lastDay = uniqueDays[uniqueDays.length - 1];
  if (lastDay === todayStr || lastDay === yesterdayStr) {
    let streak = 1;
    for (let i = uniqueDays.length - 2; i >= 0; i--) {
      const prev = new Date(uniqueDays[i]);
      const curr = new Date(uniqueDays[i + 1]);
      const diffDays =
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    currentStreak = streak;
  }

  return { currentStreak, longestStreak };
}
