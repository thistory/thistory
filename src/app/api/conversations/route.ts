import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "10") || 10, 1),
    50
  );
  const offset = Math.max(parseInt(searchParams.get("offset") || "0") || 0, 0);

  const conversations = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    skip: offset,
  });

  return NextResponse.json(conversations);
}
