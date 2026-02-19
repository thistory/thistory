import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  subDays,
  startOfDay,
} from "date-fns";

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

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getLast30Days(): string[] {
  const today = startOfDay(new Date());
  return Array.from({ length: 30 }, (_, i) =>
    format(subDays(today, 29 - i), "yyyy-MM-dd")
  );
}
