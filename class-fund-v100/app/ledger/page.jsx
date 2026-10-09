"use client";
import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, Badge, Spinner } from "@/components/ui";
import { formatVND, formatDateTime, isCampaignDeadlinePassed } from "@/lib/format";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { useI18n } from "@/components/Providers";

const PAYMENT_STATUS = {
  approved: { key: "memberStatus.paid", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200" },
  self_pending: { key: "memberStatus.review", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200" },
  pending: { key: "memberStatus.pending", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" },
  rejected: { key: "memberStatus.rejected", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" },
  not_applicable: { key: "ledger.admin", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" },
};

export default function LedgerPage() {
  const [data, setData] = useState(null);
  const [img, setImg] = useState(null);
  const [expandedCampaigns, setExpandedCampaigns] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { t } = useI18n();

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (!data) return <AppShell><div className="flex justify-center py-20"><Spinner size={40} /></div></AppShell>;

  const visiblePaymentStatuses = (data.paymentStatuses || []).filter((campaign) => {
    return !isCampaignDeadlinePassed(campaign.deadline, new Date(currentTime));
  });
  const expenses = (data.transactions || []).filter((transaction) => transaction.type === "out");

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("ledger.title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("ledger.public")}</p>
        </div>
        <Card className="py-2 px-4">
          <span className="text-sm text-gray-500">{t("ledger.balance")} </span>
          <b className="text-lg text-brand-600">{formatVND(data.balance)}</b>
        </Card>
      </div>

      <Card>
        <div className="space-y-2">
          {expenses.map((t) => (
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
          {expenses.length === 0 && (
            <div className="text-center py-10 text-gray-500">{t("ledger.noExpenses")}</div>
          )}
        </div>
      </Card>

      {visiblePaymentStatuses.length > 0 && <section className="mt-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("ledger.memberStatuses")}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("ledger.statusDescription")}
          </p>
        </div>
        {visiblePaymentStatuses.map((campaign) => (
          <Card key={String(campaign.id)}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{campaign.title}</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {campaign.status === "closed" ? t("ledger.campaignClosed") : t("ledger.campaignOpen")}
              </span>
            </div>
            {campaign.members.length ? (
              <>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(expandedCampaigns[campaign.id]
                    ? campaign.members
                    : campaign.members.slice(0, 5)
                  ).map((member) => {
                    const status = PAYMENT_STATUS[member.status] || PAYMENT_STATUS.pending;
                    return (
                      <div
                        key={String(member.id)}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-1 last:pb-1"
                      >
                        <div className="min-w-0 font-medium text-gray-900 dark:text-white">
                          <span>{member.name}</span>
                          {member.isOwner && (
                            <span className="ml-2 text-xs font-semibold text-brand-600 dark:text-brand-300">
                              {member.isViewer ? t("ledger.you") : t("ledger.owner")}
                            </span>
                          )}
                          {member.studentId && (
                            <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                              {member.studentId}
                            </span>
                          )}
                        </div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                          {t(status.key)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {campaign.members.length > 5 && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCampaigns((expanded) => ({
                        ...expanded,
                        [campaign.id]: !expanded[campaign.id],
                      }))
                    }
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
                    aria-expanded={Boolean(expandedCampaigns[campaign.id])}
                  >
                    {expandedCampaigns[campaign.id] ? (
                      <>{t("ledger.collapse")} <ChevronUp size={16} /></>
                    ) : (
                      <>{t("ledger.showAll", { count: campaign.members.length })} <ChevronDown size={16} /></>
                    )}
                  </button>
                )}
              </>
            ) : (
              <p className="py-4 text-sm text-gray-500 dark:text-gray-400">{t("ledger.noMembers")}</p>
            )}
          </Card>
        ))}
      </section>}

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
