import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationSettings } from "@/components/settings/notification-settings";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      notificationEnabled: true,
      notificationTime: true,
      timezone: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 items-center border-b border-border px-6">
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
      </header>
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <NotificationSettings
            preferences={{
              notificationEnabled: user.notificationEnabled,
              notificationTime: user.notificationTime,
              timezone: user.timezone,
            }}
          />
        </div>
      </div>
    </div>
  );
}
