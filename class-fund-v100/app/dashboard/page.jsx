"use client";
import React, { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, StatCard, Spinner, Button } from "@/components/ui";
import { Wallet, TrendingUp, TrendingDown, Users, Megaphone, Clock, QrCode } from "lucide-react";
import { formatVND } from "@/lib/format";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useAuth, useI18n } from "@/components/Providers";

function SoftChartCursor({ x, y, width, height }) {
  if (![x, y, width, height].every(Number.isFinite)) return null;
  return (
    <rect
      x={x + 4}
      y={y}
      width={Math.max(0, width - 8)}
      height={height}
      rx={12}
      fill="#16a34a"
      fillOpacity={0.07}
    />
  );
}

function WaveActiveBar({ x, y, width, height, fill }) {
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  const waveY = y + Math.min(12, height / 2);
  const amplitude = Math.min(3, height / 6);
  const path = [
    `M ${x} ${waveY}`,
    `C ${x + width * 0.25} ${waveY - amplitude}`,
    `${x + width * 0.25} ${waveY - amplitude}`,
    `${x + width * 0.5} ${waveY}`,
    `S ${x + width * 0.75} ${waveY + amplitude}`,
    `${x + width} ${waveY}`,
  ].join(" ");

  return (
    <g className="dashboard-active-bar">
      <rect x={x} y={y} width={width} height={height} rx={6} fill={fill} />
      <path
        d={path}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.8}
        strokeWidth={2}
        strokeLinecap="round"
        className="dashboard-wave-line"
      />
    </g>
  );
}

function DashboardChartTooltip({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="dashboard-tooltip-enter min-w-40 rounded-xl border border-white/70 bg-white/95 p-3 shadow-xl shadow-slate-900/10 backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/95">
      <p className="mb-2 border-b border-gray-100 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
        {label}
      </p>
      <div className="space-y-2">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-5 text-sm">
            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {t(entry.dataKey === "in" ? "dashboard.in" : "dashboard.out")}
            </span>
            <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
              {formatVND(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/transactions/summary");
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || t("dashboard.loadError"));
      }
      if (!Array.isArray(result.chart)) {
        throw new Error(t("dashboard.invalidChart"));
      }
      setData(result);
    } catch (err) {
      setError(err.message || t("dashboard.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const isMember = user?.role === "member" || user?.role === "student";

  if (loading) {
    return <AppShell><div className="flex justify-center py-20"><Spinner size={40} /></div></AppShell>;
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl py-12">
          <Card className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t("dashboard.loadError")}</h1>
            <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error || t("dashboard.invalidChart")}</p>
            <div className="mt-5 flex justify-center gap-3">
              <Button onClick={loadDashboard}>{t("common.retry")}</Button>
              {isMember && (
                <Link href="/campaigns" className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                  <QrCode size={16} /> {t("dashboard.goPay")}
                </Link>
              )}
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("dashboard.greeting", { name: user?.name || "" })}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("dashboard.subtitle")}</p>
        </div>
        {isMember && (data.myPending > 0 || data.myPaid > 0) && (
          <Card className="w-full shrink-0 p-4 sm:w-auto sm:min-w-[280px] sm:max-w-sm border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {t("dashboard.paymentStatus")}
              </h2>
              <Link
                href="/campaigns"
                aria-label={t("dashboard.goPay")}
                className="rounded-full bg-brand-50 p-2 text-brand-700 transition hover:bg-brand-100 dark:bg-brand-900/40 dark:text-brand-200 dark:hover:bg-brand-900/70"
              >
                <QrCode size={16} />
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                {t("dashboard.paid")} <b className="tabular-nums">{formatVND(data.myPaid)}</b>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {t("dashboard.remaining")} <b className="tabular-nums">{formatVND(data.myPending)}</b>
              </span>
            </div>
          </Card>
        )}
      </div>

      {isMember && (
        <Card className="mb-6 border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-brand-800 dark:text-brand-200">{t("dashboard.qrTitle")}</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {t("dashboard.qrDescription")}
              </p>
            </div>
            <Link href="/campaigns" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              <QrCode size={16} /> {t("dashboard.goPay")}
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label={t("dashboard.balance")} value={formatVND(data.balance ?? 0)} icon={<Wallet size={24} />} color="blue" />
        <StatCard label={t("dashboard.totalIn")} value={formatVND(data.totalIn ?? 0)} icon={<TrendingUp size={24} />} color="green" />
        <StatCard label={t("dashboard.totalOut")} value={formatVND(data.totalOut ?? 0)} icon={<TrendingDown size={24} />} color="red" />
        <StatCard label={t("dashboard.openCampaigns")} value={data.openCampaigns ?? 0} icon={<Megaphone size={24} />} color="purple" />
        <StatCard label={t("dashboard.memberCount")} value={data.memberCount ?? 0} icon={<Users size={24} />} color="yellow" />
        <StatCard label={t("dashboard.selfPending")} value={data.selfPendingCount ?? 0} icon={<QrCode size={24} />} color="yellow" />
      </div>

      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t("dashboard.chartTitle")}</h3>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v / 1000) + "k"} />
              <Tooltip
                content={<DashboardChartTooltip t={t} />}
                cursor={<SoftChartCursor />}
                animationDuration={180}
              />
              <Legend />
              <Bar dataKey="in" name={t("dashboard.in")} fill="#16a34a" radius={[4, 4, 0, 0]} activeBar={<WaveActiveBar />} />
              <Bar dataKey="out" name={t("dashboard.out")} fill="#dc2626" radius={[4, 4, 0, 0]} activeBar={<WaveActiveBar />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </AppShell>
  );
}
