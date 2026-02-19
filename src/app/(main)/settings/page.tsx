import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { LanguageSwitcher } from "@/components/settings/language-switcher";
import { AIModelSettings } from "@/components/settings/ai-model-settings";

export default async function SettingsPage() {
  const session = await auth();
  const t = await getTranslations("settings");
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      notificationEnabled: true,
      notificationTime: true,
      timezone: true,
      aiProvider: true,
      aiModel: true,
      ollamaUrl: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 items-center border-b border-border px-6">
        <h1 className="text-lg font-semibold text-foreground">{t("title")}</h1>
      </header>
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <AIModelSettings
            preferences={{
              aiProvider: user.aiProvider,
              aiModel: user.aiModel,
              ollamaUrl: user.ollamaUrl,
            }}
          />
          <NotificationSettings
            preferences={{
              notificationEnabled: user.notificationEnabled,
              notificationTime: user.notificationTime,
              timezone: user.timezone,
            }}
          />
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
