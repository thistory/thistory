"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export function LanguageSwitcher() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const router = useRouter();

  function handleChange(newLocale: string) {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">{t("language")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("languageDescription")}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleChange("ko")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            locale === "ko"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background text-foreground hover:bg-secondary"
          }`}
        >
          {t("ko")}
        </button>
        <button
          type="button"
          onClick={() => handleChange("en")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            locale === "en"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background text-foreground hover:bg-secondary"
          }`}
        >
          {t("en")}
        </button>
      </div>
    </div>
  );
}
