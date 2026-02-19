"use client";

import { useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format, subDays, startOfDay } from "date-fns";

interface ActivityChartProps {
  conversationDates: string[];
}

export function ActivityChart({ conversationDates }: ActivityChartProps) {
  const t = useTranslations("dashboard");
  const today = startOfDay(new Date());
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i);
    return format(date, "yyyy-MM-dd");
  });

  const dateCounts = conversationDates.reduce(
    (acc, date) => {
      const day = format(new Date(date), "yyyy-MM-dd");
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const data = last30Days.map((day) => ({
    date: format(new Date(day), "MMM d"),
    conversations: dateCounts[day] || 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("activityTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#78716c" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#78716c" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e7e0d8",
                  fontSize: "13px",
                }}
              />
              <Area
                type="monotone"
                dataKey="conversations"
                stroke="#d97706"
                strokeWidth={2}
                fill="url(#colorConv)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
