"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

interface InsightCount {
  type: string;
  count: number;
}

interface InsightsSummaryProps {
  counts: InsightCount[];
  recentInsights: Array<{
    id: string;
    type: string;
    content: string;
  }>;
}

const typeConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  GOAL: { label: "Goals", variant: "goal" },
  CONCERN: { label: "Concerns", variant: "concern" },
  ACTION: { label: "Actions", variant: "action" },
  HABIT: { label: "Habits", variant: "habit" },
};

export function InsightsSummary({
  counts,
  recentInsights,
}: InsightsSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {counts.map(({ type, count }) => {
            const config = typeConfig[type] || {
              label: type,
              variant: "default" as BadgeVariant,
            };
            return (
              <div
                key={type}
                className="flex items-center justify-between rounded-xl border border-border p-3"
              >
                <Badge variant={config.variant}>{config.label}</Badge>
                <span className="text-lg font-semibold text-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {recentInsights.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Recent
            </p>
            {recentInsights.slice(0, 5).map((insight) => {
              const config = typeConfig[insight.type];
              return (
                <div
                  key={insight.id}
                  className="flex items-start gap-2 text-sm"
                >
                  <Badge variant={config?.variant || "default"} className="mt-0.5 shrink-0">
                    {config?.label || insight.type}
                  </Badge>
                  <span className="text-foreground">{insight.content}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
