"use client";
import React, { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, Button, Badge, Modal, Input, Spinner } from "@/components/ui";
import QRPayModal from "@/components/QRPayModal";
import { useToast } from "@/components/Toast";
import { useAuth, useI18n } from "@/components/Providers";
import { formatVND, formatDate } from "@/lib/format";
import { Megaphone, Plus, QrCode, Banknote, Clock, CheckCircle2, XCircle, Eye, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

const STATUS_MAP = {
  pending: { key: "campaigns.pending", color: "gray", icon: Clock },
  self_pending: { key: "campaigns.selfPending", color: "yellow", icon: Clock },
  approved: { key: "campaigns.approved", color: "green", icon: CheckCircle2 },
  rejected: { key: "campaigns.rejected", color: "red", icon: XCircle },
};

export default function CampaignsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const isMember = user?.role === "member" || user?.role === "student";
  const toast = useToast();
  const [campaigns, setCampaigns] = useState(null);
  const [me, setMe] = useState(null);
  const [qrModal, setQrModal] = useState(null); // { contributionId, amount, title }
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", amountPerPerson: "", deadline: "" });
  const [proofModal, setProofModal] = useState(null); // url anh bien lai

  const load = useCallback(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => {
        setCampaigns(d.campaigns || []);
        setMe(d.me);
      })
      .catch(() => toast(t("campaigns.loadError"), "error"));
  }, [toast, t]);
  useEffect(() => {
    load();
  }, [load]);

  const createCampaign = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amountPerPerson) { toast(t("campaigns.createError"), "error"); return; }
    setCreating(true);
    try {
      const r = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast(t("campaigns.createSuccess"), "success");
      setCreateOpen(false);
      setForm({ title: "", description: "", amountPerPerson: "", deadline: "" });
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setCreating(false);
    }
  };

  const deleteCampaign = async (campaign) => {
    if (!campaign.canDelete) return;
    if (!window.confirm(t("campaigns.deleteConfirm", { title: campaign.title }))) {
      return;
    }

    setDeletingId(String(campaign._id));
    try {
      const response = await fetch(`/api/campaigns/${campaign._id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t("campaigns.deleteError"));
      toast(t("campaigns.deleteSuccess"), "success");
      load();
    } catch (error) {
      toast(error.message, "error");
      load();
    } finally {
      setDeletingId(null);
    }
  };

  if (!campaigns) {
    return <AppShell><div className="flex justify-center py-20"><Spinner size={40} /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("campaigns.title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user?.role === "admin" ? t("campaigns.adminDescription") : t("campaigns.studentDescription")}
          </p>
        </div>
        {user?.role === "admin" && (
          <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> {t("campaigns.create")}</Button>
        )}
      </div>

      {campaigns.length === 0 && (
        <Card className="text-center py-12 text-gray-500">{t("campaigns.empty")}</Card>
      )}

      <div className="space-y-4">
        {campaigns.map((c) => {
          const my = c.myContribution;
          const st = my ? STATUS_MAP[my.status] : null;
          const paidCount = c.contributions.filter((x) => x.status === "approved").length;
          const totalCount = c.contributions.length;
          const pct = totalCount ? Math.round((paidCount / totalCount) * 100) : 0;
          const selfPendingCount = c.contributions.filter((x) => x.status === "self_pending").length;
          return (
            <Card key={String(c._id)}>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Megaphone size={18} className="text-brand-600 flex-shrink-0" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{c.title}</h3>
                    {c.status === "closed" && <Badge color="gray">{t("campaigns.closed")}</Badge>}
                    {selfPendingCount > 0 && user?.role === "admin" && (
                      <Badge color="yellow"><Clock size={12} className="mr-1" />{selfPendingCount} {t("campaigns.review")}</Badge>
                    )}
                  </div>
                  {c.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{c.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                    <span>{t("campaigns.amountPerPerson")} <b className="text-gray-900 dark:text-white">{formatVND(c.amountPerPerson)}</b></span>
                    {c.deadline && <span>{t("campaigns.deadline")} {formatDate(c.deadline)}</span>}
                    <span>{t("campaigns.progress")} {paidCount}/{totalCount} ({pct}%)</span>
                  </div>
                  {/* Thanh tien do */}
                  <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: pct + "%" }} />
                  </div>
                </div>

                {/* Phan hanh dong */}
                <div className="flex flex-col items-end gap-2 min-w-[200px]">
                  {isMember && my && (
                    <>
                      {st && <Badge color={st.color}><st.icon size={12} className="mr-1" />{t(st.key)}</Badge>}
                      {my.status !== "approved" && (
                        <div className="flex gap-2 flex-wrap justify-end">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => setQrModal({ contributionId: String(my._id), amount: my.amount, title: c.title })}
                          >
                            <QrCode size={16} /> {t("campaigns.payQr")}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => {
                            fetch(`/api/contributions/${my._id}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: "Nop tien mat" }) })
                              .then((r) => r.json()).then((d) => {
                                if (d.error) toast(d.error, "error"); else { toast(t("campaigns.cashSuccess"), "success"); load(); }
                              });
                          }}>
                            <Banknote size={16} /> {t("campaigns.payCash")}
                          </Button>
                        </div>
                      )}
                      {my.status === "self_pending" && my.proofImage && (
                        <button className="text-xs text-brand-600 hover:underline flex items-center gap-1" onClick={() => setProofModal(my.proofImage)}>
                          <Eye size={12} /> {t("campaigns.receipt")}
                        </button>
                      )}
                    </>
                  )}
                  {user?.role === "admin" && (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/campaigns/${c._id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        <Eye size={16} /> {t("campaigns.detailApprove")}
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={!c.canDelete || deletingId === String(c._id)}
                        title={c.canDelete ? t("campaigns.deleteTitle") : t("campaigns.deleteBlocked")}
                        onClick={() => deleteCampaign(c)}
                      >
                        {deletingId === String(c._id) ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        {t("campaigns.delete")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal tao dot thu (admin) */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("campaigns.createNew")}>
        <form onSubmit={createCampaign} className="space-y-4">
          <Input label={t("campaigns.createTitle")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Quy hoc ky II" required />
          <Input label={t("campaigns.description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t("campaigns.description")} />
          <Input label={t("campaigns.amountInput")} type="number" value={form.amountPerPerson} onChange={(e) => setForm({ ...form, amountPerPerson: e.target.value })} placeholder="100000" required />
          <Input label={t("campaigns.deadlineInput")} type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {creating ? t("campaigns.creating") : t("campaigns.create")}
          </Button>
        </form>
      </Modal>

      {/* v100: Modal Tu nop QR */}
      {qrModal && (
        <QRPayModal
          open={!!qrModal}
          contributionId={qrModal.contributionId}
          amount={qrModal.amount}
          title={qrModal.title}
          onClose={() => setQrModal(null)}
          onSuccess={load}
        />
      )}

      {/* Modal xem bien lai */}
      <Modal open={!!proofModal} onClose={() => setProofModal(null)} title={t("common.receipt")}>
        {proofModal?.startsWith("data:") || proofModal?.startsWith("http") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={proofModal} alt="Bien lai" className="w-full rounded-lg" />
        ) : (
          <div className="text-gray-500">{t("common.noImage")}</div>
        )}
      </Modal>
    </AppShell>
  );
}
