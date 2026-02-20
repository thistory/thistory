import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { logger } from "@/lib/logger";

const TEST_MESSAGES: Record<string, { title: string; body: string }> = {
  ko: {
    title: "테스트 알림",
    body: "이 알림이 보이면 푸시 알림이 정상 작동하고 있어요!",
  },
  en: {
    title: "Test Notification",
    body: "If you see this, push notifications are working!",
  },
};

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { locale: true },
    });

    const messages = TEST_MESSAGES[user?.locale ?? "ko"] ?? TEST_MESSAGES.ko;
    const result = await sendPushToUser(session.user.id, {
      title: messages.title,
      body: messages.body,
      url: "/settings",
    });

    logger.info("Test notification sent", { userId: session.user.id, ...result });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Test notification failed", { userId: session.user.id, error });
    return NextResponse.json(
      { error: "Failed to send notification", sent: 0, failed: 1 },
      { status: 500 }
    );
  }
}
