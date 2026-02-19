"use client";

import { useEffect, useState, useCallback } from "react";

interface NotificationSettingsProps {
  preferences: {
    notificationEnabled: boolean;
    notificationTime: string;
    timezone: string;
  };
}

export function NotificationSettings({ preferences }: NotificationSettingsProps) {
  const [enabled, setEnabled] = useState(preferences.notificationEnabled);
  const [time, setTime] = useState(preferences.notificationTime);
  const [timezone, setTimezone] = useState(preferences.timezone);
  const [saving, setSaving] = useState(false);
  const [supported, setSupported] = useState(true);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [status, setStatus] = useState<null | "saved" | "error">(null);
  const [timeChanged, setTimeChanged] = useState(false);

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

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Daily Reminder</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Get notified when it&apos;s time for your daily reflection
        </p>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Enable notifications</p>
            <p className="text-xs text-muted-foreground">
              Receive a daily push notification reminder
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
            Push notifications are not supported in this browser.
          </div>
        )}

        {permissionState === "denied" && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
            Notifications are blocked. Please enable them in your browser settings and try again.
          </div>
        )}

        {enabled && (
          <div className="space-y-4 border-t border-border pt-5">
            <div>
              <label
                htmlFor="notification-time"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Reminder time
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
                Timezone: {timezone}
              </p>
            </div>

            {timeChanged && (
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveTime}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save time"}
              </button>
            )}
          </div>
        )}

        {status === "saved" && (
          <div className="rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary">
            Settings saved
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
            Failed to save settings
          </div>
        )}
      </div>
    </div>
  );
}
