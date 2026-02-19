import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.");
  }
  webpush.setVapidDetails("mailto:noreply@thistory.app", publicKey, privateKey);
  vapidConfigured = true;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<void> {
  ensureVapidConfigured();
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
      { TTL: 3600, urgency: "normal" }
    );
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 410 || statusCode === 404) {
      logger.info("Removing expired push subscription", { endpoint: subscription.endpoint });
      await prisma.pushSubscription.delete({
        where: { endpoint: subscription.endpoint },
      }).catch((err) => {
        logger.warn("Failed to delete expired subscription", {
          endpoint: subscription.endpoint,
          error: err,
        });
      });
    }
    throw error;
  }
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    subscriptions.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
      sendPushNotification(sub, payload)
    )
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}
