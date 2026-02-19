import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";
import { logger } from "@/lib/logger";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendPushToUser(session.user.id, {
      title: "Test Notification",
      body: "If you see this, push notifications are working!",
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
