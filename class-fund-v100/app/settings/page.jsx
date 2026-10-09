"use client";
import React from "react";
import AppShell from "@/components/AppShell";
import { Card, Button } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Settings as SettingsIcon, LogOut, Sun, Moon } from "lucide-react";
import { useAuth, useI18n, useTheme } from "@/components/Providers";

export default function SettingsPage() {
  const toast = useToast();
  const { logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { language, languages, setLanguage, t } = useI18n();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast(t("settings.logoutError"), "error");
    }
  };

  return (
    <AppShell>
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
        <SettingsIcon size={24} /> {t("settings.title")}
      </h1>

      <div className="space-y-6">
        <Card className="max-w-xl">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("settings.language")}</span>
            <select
              value={language}
              onChange={(event) => {
                const nextLanguage = event.target.value;
                setLanguage(nextLanguage);
                toast(t("settings.languageSaved", {}, nextLanguage), "success");
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            >
              {languages.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </select>
          </label>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t("settings.languageHint")}</p>
        </Card>

        <Card className="max-w-xl">
          <h2 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">{t("settings.theme")}</h2>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{t("settings.themeHint")}</p>
          <div className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700" role="group" aria-label={t("settings.theme")}>
            <button
              type="button"
              aria-pressed={!dark}
              onClick={() => { if (dark) toggle(); }}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${!dark ? "bg-brand-600 text-white" : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"}`}
            >
              <Sun size={16} /> {t("theme.light")}
            </button>
            <button
              type="button"
              aria-pressed={dark}
              onClick={() => { if (!dark) toggle(); }}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${dark ? "bg-brand-600 text-white" : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"}`}
            >
              <Moon size={16} /> {t("theme.dark")}
            </button>
          </div>
        </Card>

        <Card className="max-w-xl">
          <Button variant="danger" onClick={handleLogout}>
            <LogOut size={16} /> {t("settings.logout")}
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
