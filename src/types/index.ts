import type {
  User,
  Conversation,
  Message,
  Insight,
  Streak,
  MessageRole,
  InsightType,
} from "@prisma/client";

export type { User, Conversation, Message, Insight, Streak };
export { MessageRole, InsightType };

export type SafeUser = Omit<User, "passwordHash">;

export type ConversationWithMessages = Conversation & {
  messages: Message[];
};

export type ConversationWithDetails = Conversation & {
  messages: Message[];
  insights: Insight[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
};

export type DashboardData = {
  streak: Streak | null;
  recentConversations: Conversation[];
  insights: {
    goals: Insight[];
    concerns: Insight[];
    actions: Insight[];
    habits: Insight[];
  };
  conversationDates: Date[];
};

export type ApiResponse<T> = {
  data: T;
  success: true;
};

export type ApiError = {
  error: string;
  success: false;
};
