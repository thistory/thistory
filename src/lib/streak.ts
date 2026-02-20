import { prisma } from "./prisma";

export async function updateStreak(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await prisma.streak.findUnique({
    where: { userId },
  });

  if (!streak) {
    await prisma.streak.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastConversationDate: today },
    });
    return;
  }

  if (streak.lastConversationDate) {
    const lastDate = new Date(streak.lastConversationDate);
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / 86_400_000);

    if (diffDays === 0) return;

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
      return;
    }
  }

  // Streak broken or no lastConversationDate
  await prisma.streak.update({
    where: { userId },
    data: { currentStreak: 1, lastConversationDate: today },
  });
}
