"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import vi from "@/locales/vi.json";
import en from "@/locales/en.json";
import ko from "@/locales/ko.json";
import zh from "@/locales/zh.json";
import ja from "@/locales/ja.json";
import lo from "@/locales/lo.json";
import th from "@/locales/th.json";

const AuthContext = createContext(null);
const ThemeContext = createContext(null);
const I18nContext = createContext(null);
const DICTIONARIES = { vi, en, ko, zh, ja, lo, th };
export const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "lo", label: "ລາວ" },
  { code: "th", label: "ไทย" },
];

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState("vi");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("class-fund-language");
    if (savedLanguage && DICTIONARIES[savedLanguage]) setLanguageState(savedLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage) => {
    if (!DICTIONARIES[nextLanguage]) return;
    window.localStorage.setItem("class-fund-language", nextLanguage);
    setLanguageState(nextLanguage);
  }, []);
  const t = useCallback((key, params = {}, targetLanguage = language) => {
    const template = DICTIONARIES[targetLanguage]?.[key] || vi[key] || key;
    return Object.entries(params).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template
    );
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, languages: LANGUAGES, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  const login = (u) => setUser(u);
  const logout = async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) throw new Error("Logout failed");
    setUser(null);
    window.location.href = "/login";
  };
  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    setDark((d) => {
      const nd = !d;
      localStorage.setItem("theme", nd ? "dark" : "light");
      document.documentElement.classList.toggle("dark", nd);
      return nd;
    });
  };
  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
 return useContext(ThemeContext);
}
