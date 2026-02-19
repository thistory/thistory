"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/utils";

function useRelativeDateLabels() {
  const tc = useTranslations("common");
  return { today: tc("today"), yesterday: tc("yesterday") };
}

interface Insight {
  id: string;
  type: string;
  content: string;
  tags: string[] | string;
  createdAt: string;
}

interface GoalsListProps {
  insights: Insight[];
}

export function GoalsList({ insights }: GoalsListProps) {
  const t = useTranslations("dashboard");
  const dateLabels = useRelativeDateLabels();

  const parseTags = (tags: string[] | string): string[] => {
    if (Array.isArray(tags)) return tags;
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  };

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("goalsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("goalsEmpty")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("goalsTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className="flex items-start gap-3 rounded-xl border border-border p-3"
            >
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{insight.content}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {parseTags(insight.tags).map((tag) => (
                    <Badge key={tag} variant="default">
                      {tag}
                    </Badge>
                  ))}
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(insight.createdAt, dateLabels)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
