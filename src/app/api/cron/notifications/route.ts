import { NextRequest, NextResponse } from "next/server";
import { checkAndSendNotifications } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || !authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expected = `Bearer ${cronSecret}`;
  if (authHeader.length !== expected.length || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await checkAndSendNotifications();
  return NextResponse.json(result);
}
