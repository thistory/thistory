import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("demo1234", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@thistory.app" },
    update: {},
    create: {
      email: "demo@thistory.app",
      name: "Demo User",
      passwordHash,
    },
  });

  // Create streak record
  await prisma.streak.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      currentStreak: 3,
      longestStreak: 7,
      lastConversationDate: new Date(),
    },
  });

  // Create sample conversations
  const conv1 = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: "Reflecting on productivity",
      summary: "Focused on improving daily productivity habits",
      messages: {
        create: [
          {
            role: "ASSISTANT",
            content:
              "Good evening! How did your day go today?",
          },
          {
            role: "USER",
            content:
              "It was pretty productive actually. I managed to finish the project proposal I've been putting off.",
          },
          {
            role: "ASSISTANT",
            content:
              "That's great to hear! Finishing something you've been putting off must feel really satisfying. What helped you finally get it done today?",
          },
          {
            role: "USER",
            content:
              "I think blocking out two hours in the morning with no distractions really helped. I turned off all notifications.",
          },
          {
            role: "ASSISTANT",
            content:
              "That's a powerful strategy — focused time blocks can make a huge difference. Is that something you'd like to make a regular habit?",
          },
          {
            role: "USER",
            content:
              "Yeah, I think I want to do that every morning. My goal is to be more intentional about how I spend my mornings.",
          },
        ],
      },
    },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: "Dealing with work stress",
      summary: "Processing feelings about upcoming deadline pressure",
      createdAt: new Date(Date.now() - 86400000), // yesterday
      messages: {
        create: [
          {
            role: "ASSISTANT",
            content: "Hi there! How are you feeling today?",
          },
          {
            role: "USER",
            content:
              "A bit stressed honestly. We have a big deadline next week and I'm worried about getting everything done.",
          },
          {
            role: "ASSISTANT",
            content:
              "I hear you — deadline pressure can feel overwhelming. What's the biggest thing on your mind about it?",
          },
          {
            role: "USER",
            content:
              "I'm concerned about the quality of my work. I don't want to rush things just to meet the deadline.",
          },
          {
            role: "ASSISTANT",
            content:
              "That shows real integrity in your work. What's one small step you could take tomorrow to ease that concern?",
          },
          {
            role: "USER",
            content:
              "I could prioritize the most critical sections first and make sure those are solid, even if other parts need more polish.",
          },
        ],
      },
    },
  });

  const conv3 = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: "Learning and growth",
      summary: "Excited about new learning opportunities",
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      messages: {
        create: [
          {
            role: "ASSISTANT",
            content: "Good evening! What stood out to you today?",
          },
          {
            role: "USER",
            content:
              "I started reading a new book about systems thinking. It's really changing how I see problems at work.",
          },
          {
            role: "ASSISTANT",
            content:
              "That sounds fascinating! What's one insight from the book that resonated with you?",
          },
          {
            role: "USER",
            content:
              "The idea that most problems are interconnected. Instead of fixing symptoms, you should look at the whole system.",
          },
        ],
      },
    },
  });

  // Create sample insights
  await prisma.insight.createMany({
    data: [
      {
        conversationId: conv1.id,
        userId: user.id,
        type: "GOAL",
        content: "Be more intentional about morning routines",
        tags: JSON.stringify(["productivity", "habits"]),
      },
      {
        conversationId: conv1.id,
        userId: user.id,
        type: "HABIT",
        content: "Morning focus blocks with no distractions",
        tags: JSON.stringify(["productivity", "focus"]),
      },
      {
        conversationId: conv1.id,
        userId: user.id,
        type: "ACTION",
        content: "Completed the project proposal",
        tags: JSON.stringify(["work", "achievement"]),
      },
      {
        conversationId: conv2.id,
        userId: user.id,
        type: "CONCERN",
        content: "Worried about work quality under deadline pressure",
        tags: JSON.stringify(["work", "stress"]),
      },
      {
        conversationId: conv2.id,
        userId: user.id,
        type: "ACTION",
        content: "Plan to prioritize critical sections first",
        tags: JSON.stringify(["work", "planning"]),
      },
      {
        conversationId: conv3.id,
        userId: user.id,
        type: "GOAL",
        content: "Apply systems thinking to work problems",
        tags: JSON.stringify(["learning", "personal-growth"]),
      },
      {
        conversationId: conv3.id,
        userId: user.id,
        type: "HABIT",
        content: "Reading books on problem-solving",
        tags: JSON.stringify(["learning", "reading"]),
      },
    ],
  });

  console.log("Seed complete!");
  console.log(`  User: ${user.email} / demo1234`);
  console.log(`  Conversations: 3`);
  console.log(`  Insights: 7`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
