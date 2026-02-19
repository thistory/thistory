export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logger } = await import("@/lib/logger");
    const { checkAndSendNotifications } = await import("@/lib/notifications");

    let lastRunKey = "";

    async function tick() {
      const now = new Date();
      const key = `${now.getHours()}:${now.getMinutes()}`;
      if (key === lastRunKey) return;
      lastRunKey = key;

      try {
        await checkAndSendNotifications();
      } catch (error) {
        logger.error("Scheduler notification check failed", error);
      }
    }

    logger.info("Notification scheduler started");

    setTimeout(tick, 3_000);
    setInterval(tick, 30_000);
  }
}
