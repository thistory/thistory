import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { logger } from "@/lib/logger";

function getCurrentLocalTime(timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

const NOTIFICATION_MESSAGES: Record<string, {
  title: string;
  body: (name?: string | null) => string;
}> = {
  ko: {
    title: "오늘의 스토리 시간이에요 ✨",
    body: (name) =>
      name
        ? `${name}님, 오늘의 5분 스토리가 기다리고 있어요.`
        : "오늘의 5분 스토리가 기다리고 있어요.",
  },
  en: {
    title: "Time for Your Story ✨",
    body: (name) =>
      name
        ? `Hi ${name}! Your daily 5-minute story is waiting.`
        : "Hi there! Your daily 5-minute story is waiting.",
  },
};

export async function checkAndSendNotifications(): Promise<{
  sent: number;
  failed: number;
  checked: number;
}> {
  const users = await prisma.user.findMany({
    where: {
      notificationEnabled: true,
      pushSubscriptions: { some: {} },
    },
    select: {
      id: true,
      name: true,
      locale: true,
      notificationTime: true,
      timezone: true,
    },
  });

  let sent = 0;
  let failed = 0;

  logger.debug("Checking notifications", { userCount: users.length });

  for (const user of users) {
    try {
      const localTime = getCurrentLocalTime(user.timezone);
      if (localTime !== user.notificationTime) continue;

      const messages = NOTIFICATION_MESSAGES[user.locale] ?? NOTIFICATION_MESSAGES.ko;
      const result = await sendPushToUser(user.id, {
        title: messages.title,
        body: messages.body(user.name),
        url: "/chat",
      });

      sent += result.sent;
      failed += result.failed;
      logger.info("Push sent", { userId: user.id, locale: user.locale, sent: result.sent });
    } catch (error) {
      failed++;
      logger.error("Push failed", { userId: user.id, error });
    }
  }

  logger.info("Notification check complete", { sent, failed, checked: users.length });
  return { sent, failed, checked: users.length };
}
