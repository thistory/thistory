import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");

  const VALID_INSIGHT_TYPES = ["GOAL", "CONCERN", "ACTION", "HABIT"];
  const where: Record<string, unknown> = { userId: session.user.id };

  if (type) {
    const normalized = type.toUpperCase();
    if (!VALID_INSIGHT_TYPES.includes(normalized)) {
      return NextResponse.json({ error: "Invalid insight type" }, { status: 400 });
    }
    where.type = normalized;
  }

  const insights = await prisma.insight.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(insights);
}
