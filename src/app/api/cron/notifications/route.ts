import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

function getCurrentLocalTime(timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      notificationEnabled: true,
      pushSubscriptions: { some: {} },
    },
    select: {
      id: true,
      name: true,
      notificationTime: true,
      timezone: true,
    },
  });

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const localTime = getCurrentLocalTime(user.timezone);
      if (localTime !== user.notificationTime) continue;

      const greeting = user.name ? `Hi ${user.name}!` : "Hi there!";
      const result = await sendPushToUser(user.id, {
        title: "Time to Reflect ✨",
        body: `${greeting} Your daily 5-minute reflection is waiting.`,
        url: "/chat",
      });

      sent += result.sent;
      failed += result.failed;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, checked: users.length });
}
