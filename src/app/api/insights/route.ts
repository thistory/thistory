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

  const where: Record<string, unknown> = { userId: session.user.id };

  if (type) {
    where.type = type.toUpperCase();
  }

  const insights = await prisma.insight.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(insights);
}
