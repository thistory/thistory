import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { authLimiter } from "@/lib/rate-limit";

export const { GET } = handlers;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = authLimiter.check(ip);
  if (!rl.success) {
    return new Response(
      JSON.stringify({ error: "Too many login attempts. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 60000) / 1000)),
        },
      }
    );
  }
  return handlers.POST(request);
}
