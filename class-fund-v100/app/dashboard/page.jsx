"use client";
import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, StatCard, Spinner } from "@/components/ui";
import { Wallet, TrendingUp, TrendingDown, Users, Megaphone, Clock, QrCode } from "lucide-react";
import { formatVND } from "@/lib/format";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useAuth } from "@/components/Providers";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/transactions/summary")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return <AppShell><div className="flex justify-center py-20"><Spinner size={40} /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Xin chao, {user?.name}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tong quan tien quy lop hoc</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="So du hien tai" value={formatVND(data.balance)} icon={<Wallet size={24} />} color="blue" />
        <StatCard label="Tong thu" value={formatVND(data.totalIn)} icon={<TrendingUp size={24} />} color="green" />
        <StatCard label="Tong chi" value={formatVND(data.totalOut)} icon={<TrendingDown size={24} />} color="red" />
        <StatCard label="Dot thu dang mo" value={data.openCampaigns} icon={<Megaphone size={24} />} color="purple" />
        <StatCard label="Thanh vien" value={data.memberCount} icon={<Users size={24} />} color="yellow" />
        <StatCard label="Cho duyet (tu nop QR)" value={data.selfPendingCount} icon={<QrCode size={24} />} color="yellow" />
      </div>

      {user?.role === "member" && (data.myPending > 0 || data.myPaid > 0) && (
        <Card className="mb-6 bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-sm text-brand-700 dark:text-brand-300 font-medium">Trang thai nop quy cua ban</div>
              <div className="mt-1 text-gray-700 dark:text-gray-200">
                Da nop: <b className="text-green-600">{formatVND(data.myPaid)}</b>
                <span className="mx-2 text-gray-400">|</span>
                Con lai: <b className="text-red-600">{formatVND(data.myPending)}</b>
              </div>
            </div>
            <a href="/campaigns" className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 inline-flex items-center gap-2">
              <QrCode size={16} /> Di den trang nop quy
            </a>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Thu - Chi 7 ngay gan nhat</h3>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v / 1000) + "k"} />
              <Tooltip formatter={(v) => formatVND(v)} />
              <Legend />
              <Bar dataKey="in" name="Thu" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="out" name="Chi" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </AppShell>
  );
}
