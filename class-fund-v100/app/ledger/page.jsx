"use client";
import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, Badge, Spinner } from "@/components/ui";
import { formatVND, formatDateTime } from "@/lib/format";
import { TrendingUp, TrendingDown, Eye } from "lucide-react";

export default function LedgerPage() {
  const [data, setData] = useState(null);
  const [img, setImg] = useState(null);

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return <AppShell><div className="flex justify-center py-20"><Spinner size={40} /></div></AppShell>;

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">So quy cong khai</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Moi nguoi deu co the xem</p>
        </div>
        <Card className="py-2 px-4">
          <span className="text-sm text-gray-500">So du: </span>
          <b className="text-lg text-brand-600">{formatVND(data.balance)}</b>
        </Card>
      </div>

      <Card>
        <div className="space-y-2">
          {(data.transactions || []).map((t) => (
            <div key={String(t._id)} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 flex-wrap gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === "in" ? "bg-green-100 text-green-600 dark:bg-green-900/40" : "bg-red-100 text-red-600 dark:bg-red-900/40"}`}>
                  {t.type === "in" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{t.description}</div>
                  <div className="text-xs text-gray-500">{formatDateTime(t.date)} · {t.category || ""}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${t.type === "in" ? "text-green-600" : "text-red-600"}`}>
                  {t.type === "in" ? "+" : "-"}{formatVND(t.amount)}
                </span>
                {t.image && (
                  <button className="text-gray-400 hover:text-brand-600" onClick={() => setImg(t.image)}><Eye size={16} /></button>
                )}
              </div>
            </div>
          ))}
          {(!data.transactions || data.transactions.length === 0) && (
            <div className="text-center py-10 text-gray-500">Chua co giao dich nao.</div>
          )}
        </div>
      </Card>

      {img && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setImg(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="Chung tu" className="w-full rounded-lg" />
            <button className="absolute top-2 right-3 text-2xl text-gray-400" onClick={() => setImg(null)}>&times;</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
