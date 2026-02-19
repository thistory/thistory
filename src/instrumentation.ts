export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logger } = await import("@/lib/logger");
    const { checkAndSendNotifications } = await import("@/lib/notifications");

    const INTERVAL_MS = 60_000;
    let lastRunMinute = -1;

    logger.info("Notification scheduler started");

    setInterval(async () => {
      const currentMinute = new Date().getMinutes();
      if (currentMinute === lastRunMinute) return;
      lastRunMinute = currentMinute;

      try {
        await checkAndSendNotifications();
      } catch (error) {
        logger.error("Scheduler notification check failed", error);
      }
    }, INTERVAL_MS);
  }
}
