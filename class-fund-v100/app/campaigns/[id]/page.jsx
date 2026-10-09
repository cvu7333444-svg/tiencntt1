"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Card, Button, Badge, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useI18n } from "@/components/Providers";
import { formatVND, formatDateTime } from "@/lib/format";
import { CheckCircle2, XCircle, Clock, QrCode, Banknote, Eye, ArrowLeft } from "lucide-react";
import Link from "next/link";

const STATUS_MAP = {
  pending: { key: "campaigns.pending", color: "gray" },
  self_pending: { key: "campaigns.selfPending", color: "yellow" },
  approved: { key: "campaigns.approved", color: "green" },
  rejected: { key: "campaigns.rejected", color: "red" },
};

export default function CampaignDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [proofUrl, setProofUrl] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch(`/api/campaigns/${id}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || t("campaigns.loadError"));
        setData(result);
      })
      .catch((err) => {
        setError(err.message || t("campaigns.loadError"));
        toast(err.message || t("campaigns.loadError"), "error");
      })
      .finally(() => setLoading(false));
  }, [id, toast, t]);
  useEffect(() => {
    load();
  }, [load]);

  const approve = async (conId, action) => {
    try {
      const r = await fetch(`/api/contributions/${conId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast(action === "reject" ? t("campaignDetail.rejected") : t("campaignDetail.approved"), "success");
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  if (loading) return <AppShell><div className="flex justify-center py-20"><Spinner size={40} /></div></AppShell>;

  return (
    <AppShell>
      <Link href="/campaigns" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-4">
        <ArrowLeft size={14} /> {t("campaignDetail.back")}
      </Link>
      {error && (
        <Card className="mb-6 border-red-200 text-center dark:border-red-800">
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <Button className="mt-4" onClick={load}>{t("common.retry")}</Button>
        </Card>
      )}
      {!error && data && (
      <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{data.campaign?.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("campaigns.amountPerPerson")} {formatVND(data.campaign?.amountPerPerson)} · {t("campaignDetail.memberCount", { count: data.contributions?.length || 0 })}
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4">{t("campaignDetail.student")}</th>
                <th className="py-2 pr-4">{t("campaignDetail.amount")}</th>
                <th className="py-2 pr-4">{t("campaignDetail.method")}</th>
                <th className="py-2 pr-4">{t("campaignDetail.status")}</th>
                <th className="py-2 pr-4">{t("campaignDetail.time")}</th>
                <th className="py-2">{t("campaignDetail.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {(data.contributions || []).map((c) => {
                const st = STATUS_MAP[c.status];
                return (
                  <tr key={String(c._id)} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-900 dark:text-white">{c.user?.name}</div>
                      <div className="text-xs text-gray-500">{c.user?.studentId} · {c.user?.email}</div>
                    </td>
                    <td className="py-3 pr-4 font-medium">{formatVND(c.amount)}</td>
                    <td className="py-3 pr-4">
                      {c.payMethod === "bank_transfer"
                        ? <span className="inline-flex items-center gap-1 text-xs"><QrCode size={12} className="text-purple-500" /> {t("campaignDetail.bankTransfer")}</span>
                        : <span className="inline-flex items-center gap-1 text-xs"><Banknote size={12} className="text-green-500" /> {t("campaignDetail.cash")}</span>}
                    </td>
                    <td className="py-3 pr-4"><Badge color={st.color}>{t(st.key)}</Badge></td>
                    <td className="py-3 pr-4 text-xs text-gray-500">{c.paidAt ? formatDateTime(c.paidAt) : "—"}</td>
                    <td className="py-3">
                      <div className="flex gap-1 flex-wrap">
                        {c.proofImage && (
                          <Button size="sm" variant="ghost" onClick={() => setProofUrl(c.proofImage)}><Eye size={14} /></Button>
                        )}
                        {c.status !== "approved" && (
                          <>
                            <Button size="sm" variant="success" onClick={() => approve(String(c._id), "approve")}><CheckCircle2 size={14} /> {t("campaignDetail.approve")}</Button>
                            <Button size="sm" variant="danger" onClick={() => approve(String(c._id), "reject")}><XCircle size={14} /></Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      </>
      )}

      {proofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setProofUrl(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proofUrl} alt="Bien lai" className="w-full rounded-lg" />
            <button className="absolute top-2 right-3 text-2xl text-gray-400" onClick={() => setProofUrl(null)}>&times;</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
