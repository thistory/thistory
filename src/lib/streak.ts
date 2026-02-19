import { prisma } from "./prisma";

export async function updateStreak(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await prisma.streak.findUnique({
    where: { userId },
  });

  if (!streak) {
    await prisma.streak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastConversationDate: today,
      },
    });
    return;
  }

  if (streak.lastConversationDate) {
    const lastDate = new Date(streak.lastConversationDate);
    lastDate.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return;
    }

    if (diffDays === 1) {
      const newCurrent = streak.currentStreak + 1;
      await prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: newCurrent,
          longestStreak: Math.max(newCurrent, streak.longestStreak),
          lastConversationDate: today,
        },
      });
    } else {
      await prisma.streak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          lastConversationDate: today,
        },
      });
    }
  } else {
    await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: 1,
        longestStreak: Math.max(1, streak.longestStreak),
        lastConversationDate: today,
      },
    });
  }
}
