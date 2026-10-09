"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Megaphone, Wallet, Users, FileBarChart, BookOpen,
  LogOut, Menu, X, Sun, Moon, Settings as SettingsIcon, Landmark,
} from "lucide-react";
import { useAuth, useI18n, useTheme } from "./Providers";
import StudentSupportButton from "./StudentSupportButton";

const NAV = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard, roles: ["admin", "member"] },
  { href: "/campaigns", label: "nav.campaigns", icon: Megaphone, roles: ["admin", "member"] },
  { href: "/ledger", label: "nav.ledger", icon: BookOpen, roles: ["admin", "member"] },
  { href: "/expense/new", label: "nav.expense", icon: Wallet, roles: ["admin"] },
  { href: "/members", label: "nav.members", icon: Users, roles: ["admin"] },
  { href: "/reports", label: "nav.reports", icon: FileBarChart, roles: ["admin"] },
  { href: "/settings/bank", label: "nav.bankSettings", icon: Landmark, roles: ["admin"] },
  { href: "/settings", label: "nav.settings", icon: SettingsIcon, roles: ["admin", "member"] },
];

const ADMIN_BOTTOM_NAV = [
  { href: "/settings/bank", label: "nav.bankSettings", icon: Landmark },
  { href: "/settings", label: "nav.systemSettings", icon: SettingsIcon },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);

  const items = NAV.filter((n) => user && n.roles.includes(user.role));
  const bottomItems = [
    ...items.filter((n) => !["/reports", "/settings/bank", "/settings"].includes(n.href)).slice(0, 5),
    ...(user?.role === "admin" ? ADMIN_BOTTOM_NAV : []),
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">Q</div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white">Quan ly Quy Lop</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">v100</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((n) => {
          const active = pathname === n.href || (n.href !== "/settings" && pathname.startsWith(n.href + "/"));
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setDrawer(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-600 text-white"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <Icon size={18} />
              {t(n.label)}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">{user?.name}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {user?.role === "admin" ? t("role.admin") : t("role.student")}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={toggle} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? t("theme.light") : t("theme.dark")}
          </button>
          <button onClick={logout} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50">
            <LogOut size={16} />
            {t("auth.logout")}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar desktop */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30">
        <SidebarContent />
      </aside>

      {/* Drawer mobile */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-gray-800 shadow-xl">
            <button onClick={() => setDrawer(false)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Top bar mobile */}
      <header className="lg:hidden sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setDrawer(true)} className="text-gray-600 dark:text-gray-300"><Menu size={22} /></button>
        <div className="font-bold text-gray-900 dark:text-white">{t("appName")}</div>
      </header>

      {/* Main */}
      <main className="lg:pl-64 pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto p-4 lg:p-8">{children}</div>
      </main>

      {/* Bottom nav mobile */}
      <nav aria-label={t("nav.bottom")} className="lg:hidden fixed bottom-0 inset-x-0 z-20 flex items-stretch border-t border-gray-200 bg-white px-1 dark:border-gray-700 dark:bg-gray-800">
        {bottomItems.map((n) => {
          const active = pathname === n.href || (n.href !== "/settings" && pathname.startsWith(n.href + "/"));
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-label={t(n.label)}
              title={t(n.label)}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 text-[9px] font-medium leading-[11px] transition-colors sm:text-[10px] ${
                active
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                  : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="line-clamp-2 w-full text-center">{t(n.label)}</span>
            </Link>
          );
        })}
      </nav>
      <StudentSupportButton />
    </div>
  );
}
