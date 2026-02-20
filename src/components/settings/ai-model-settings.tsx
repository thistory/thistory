"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

const OLLAMA_MODELS = ["exaone3.5:7.8b", "qwen3:8b", "llama3.2", "gemma3:12b"];

interface AIPreferences {
  aiProvider: string;
  aiModel: string;
  ollamaUrl: string;
}

interface AIModelSettingsProps {
  preferences: AIPreferences;
}

export function AIModelSettings({ preferences }: AIModelSettingsProps) {
  const t = useTranslations("settings");
  const useOllama = preferences.aiProvider === "ollama";
  const [enabled, setEnabled] = useState(useOllama);
  const [model, setModel] = useState(
    useOllama ? preferences.aiModel : OLLAMA_MODELS[0]
  );
  const [ollamaUrl, setOllamaUrl] = useState(preferences.ollamaUrl);
  const [customModel, setCustomModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<null | "saved" | "error">(null);
  const [testStatus, setTestStatus] = useState<
    null | "testing" | "ok" | "fail"
  >(null);
  const [hasChanges, setHasChanges] = useState(false);

  const showStatus = useCallback((s: "saved" | "error") => {
    setStatus(s);
    setTimeout(() => setStatus(null), 2000);
  }, []);

  useEffect(() => {
    const providerChanged = enabled !== useOllama;
    const modelChanged = enabled && model !== preferences.aiModel;
    const urlChanged = enabled && ollamaUrl !== preferences.ollamaUrl;
    setHasChanges(providerChanged || modelChanged || urlChanged);
  }, [enabled, model, ollamaUrl, preferences, useOllama]);

  function handleModelSelect(selectedModel: string) {
    setModel(selectedModel);
    setCustomModel("");
  }

  function handleCustomModelApply() {
    if (customModel.trim()) {
      setModel(customModel.trim());
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/ai/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiProvider: enabled ? "ollama" : "openai",
          aiModel: enabled ? model : "gpt-4.1-nano",
          ollamaUrl,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setHasChanges(false);
      showStatus("saved");
    } catch {
      showStatus("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTestStatus("testing");
    try {
      const url = `${ollamaUrl}/api/tags`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        setTestStatus("ok");
      } else {
        setTestStatus("fail");
      }
    } catch {
      setTestStatus("fail");
    }
    setTimeout(() => setTestStatus(null), 3000);
  }

  const isCustom = enabled && !OLLAMA_MODELS.includes(model);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          {t("aiModel")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("aiModelDescription")}
        </p>
      </div>

      <div className="space-y-5">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
          />
          <span className="text-sm font-medium text-foreground">
            {t("useOllama")}
          </span>
        </label>

        {enabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("aiModelName")}
              </label>
              <div className="flex flex-wrap gap-2">
                {OLLAMA_MODELS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleModelSelect(m)}
                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      model === m
                        ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/30"
                        : "border border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    {m}
                  </button>
                ))}
                {isCustom && (
                  <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary ring-1 ring-primary/30">
                    {model}
                  </span>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCustomModelApply();
                    }
                  }}
                  placeholder={t("aiCustomModelPlaceholder")}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={handleCustomModelApply}
                  disabled={!customModel.trim()}
                  className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  {t("aiApply")}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="ollama-url"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                {t("ollamaUrl")}
              </label>
              <div className="flex gap-2">
                <input
                  id="ollama-url"
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === "testing"}
                  className="rounded-xl border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  {testStatus === "testing"
                    ? t("ollamaTestTesting")
                    : t("ollamaTestConnection")}
                </button>
              </div>
              {testStatus === "ok" && (
                <p className="mt-2 text-sm font-medium text-primary">
                  {t("ollamaTestOk")}
                </p>
              )}
              {testStatus === "fail" && (
                <p className="mt-2 text-sm font-medium text-destructive">
                  {t("ollamaTestFail")}
                </p>
              )}
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("ollamaUrlHint")}
              </p>
            </div>
          </>
        )}

        {hasChanges && (
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? t("saving") : t("aiSave")}
          </button>
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
