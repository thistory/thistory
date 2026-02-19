"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

interface NotificationSettingsProps {
  preferences: {
    notificationEnabled: boolean;
    notificationTime: string;
    timezone: string;
  };
}

export function NotificationSettings({ preferences }: NotificationSettingsProps) {
  const t = useTranslations("settings");
  const [enabled, setEnabled] = useState(preferences.notificationEnabled);
  const [time, setTime] = useState(preferences.notificationTime);
  const [timezone, setTimezone] = useState(preferences.timezone);
  const [saving, setSaving] = useState(false);
  const [supported, setSupported] = useState(true);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [status, setStatus] = useState<null | "saved" | "error">(null);
  const [timeChanged, setTimeChanged] = useState(false);
  const [testStatus, setTestStatus] = useState<null | "sending" | "success" | "failed">(null);

  const showStatus = useCallback((s: "saved" | "error") => {
    setStatus(s);
    setTimeout(() => setStatus(null), 2000);
  }, []);

  useEffect(() => {
    const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(detectedTz);

    async function init() {
      const { isPushSupported, registerServiceWorker } = await import("@/lib/push-client");
      if (!isPushSupported()) {
        setSupported(false);
        return;
      }
      setPermissionState(Notification.permission);
      try {
        await registerServiceWorker();
      } catch {}

    }

    init();
  }, []);

  async function handleToggle() {
    if (saving) return;
    setSaving(true);

    try {
      if (!enabled) {
        const { subscribeToPush } = await import("@/lib/push-client");
        const subscription = await subscribeToPush();

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });

        await fetch("/api/notifications/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notificationEnabled: true,
            notificationTime: time,
            timezone,
          }),
        });

        setEnabled(true);
        setPermissionState("granted");
        showStatus("saved");
      } else {
        const { unsubscribeFromPush, getExistingSubscription } = await import("@/lib/push-client");
        const existing = await getExistingSubscription();
        const endpoint = existing?.endpoint;

        await unsubscribeFromPush();

        if (endpoint) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint }),
          });
        }

        await fetch("/api/notifications/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notificationEnabled: false,
            notificationTime: time,
            timezone,
          }),
        });

        setEnabled(false);
        showStatus("saved");
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("denied")) {
        setPermissionState("denied");
      }
      showStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTime() {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationEnabled: enabled,
          notificationTime: time,
          timezone,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      setTimeChanged(false);
      showStatus("saved");
    } catch {
      showStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestNotification() {
    setTestStatus("sending");
    try {
      const res = await fetch("/api/notifications/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.sent === 0) {
        setTestStatus("failed");
      } else {
        setTestStatus("success");
      }
    } catch {
      setTestStatus("failed");
    }
    setTimeout(() => setTestStatus(null), 3000);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">{t("dailyReminder")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dailyReminderDescription")}
        </p>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{t("enableNotifications")}</p>
            <p className="text-xs text-muted-foreground">
              {t("enableNotificationsDescription")}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={saving || !supported}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${
              enabled ? "bg-primary" : "bg-secondary"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-sm ring-0 transition-transform duration-200 ${
                enabled
                  ? "translate-x-5 bg-primary-foreground"
                  : "translate-x-0.5 bg-muted-foreground"
              } mt-0.5`}
            />
          </button>
        </div>

        {!supported && (
          <div className="rounded-xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
            {t("notSupported")}
          </div>
        )}

        {permissionState === "denied" && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
            {t("blocked")}
          </div>
        )}

        {enabled && (
          <div className="space-y-4 border-t border-border pt-5">
            <div>
              <label
                htmlFor="notification-time"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                {t("reminderTime")}
              </label>
              <input
                id="notification-time"
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setTimeChanged(true);
                }}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("timezone", { tz: timezone })}
              </p>
            </div>

            {timeChanged && (
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveTime}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? t("saving") : t("saveTime")}
              </button>
            )}

            <button
              type="button"
              disabled={testStatus === "sending"}
              onClick={handleTestNotification}
              className="rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              {testStatus === "sending" ? t("testSending") : t("testNotification")}
            </button>

            {testStatus === "success" && (
              <div className="rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary">
                {t("testSuccess")}
              </div>
            )}

            {testStatus === "failed" && (
              <div className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
                {t("testFailed")}
              </div>
            )}
          </div>
        )}

        {status === "saved" && (
          <div className="rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary">
            {t("saved")}
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
            {t("saveFailed")}
          </div>
        )}
      </div>
    </div>
  );
}
