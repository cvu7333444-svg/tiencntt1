"use client";
import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, Button, Badge, Modal, Input, Spinner } from "@/components/ui";
import QRPayModal from "@/components/QRPayModal";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/components/Providers";
import { formatVND, formatDate } from "@/lib/format";
import { Megaphone, Plus, QrCode, Banknote, Clock, CheckCircle2, XCircle, Eye, Loader2 } from "lucide-react";
import Link from "next/link";

const STATUS_MAP = {
  pending: { label: "Chua nop", color: "gray", icon: Clock },
  self_pending: { label: "Da chuyen khoan - cho duyet", color: "yellow", icon: Clock },
  approved: { label: "Da nop", color: "green", icon: CheckCircle2 },
  rejected: { label: "Bi tu choi - nop lai", color: "red", icon: XCircle },
};

export default function CampaignsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [campaigns, setCampaigns] = useState(null);
  const [me, setMe] = useState(null);
  const [qrModal, setQrModal] = useState(null); // { contributionId, amount, title }
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", amountPerPerson: "", deadline: "" });
  const [proofModal, setProofModal] = useState(null); // url anh bien lai

  const load = () => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => {
        setCampaigns(d.campaigns || []);
        setMe(d.me);
      })
      .catch(() => toast("Khong tai duoc du lieu", "error"));
  };
  useEffect(load, []);

  const createCampaign = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amountPerPerson) { toast("Vui long nhap tieu de va so tien", "error"); return; }
    setCreating(true);
    try {
      const r = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast("Da tao dot thu moi", "success");
      setCreateOpen(false);
      setForm({ title: "", description: "", amountPerPerson: "", deadline: "" });
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setCreating(false);
    }
  };

  if (!campaigns) {
    return <AppShell><div className="flex justify-center py-20"><Spinner size={40} /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dot thu / Nop quy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user?.role === "admin" ? "Quan ly cac dot thu va duyet nop tien" : "Cac dot quy ban can nop"}
          </p>
        </div>
        {user?.role === "admin" && (
          <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Tao dot thu</Button>
        )}
      </div>

      {campaigns.length === 0 && (
        <Card className="text-center py-12 text-gray-500">Chua co dot thu nao.</Card>
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
                    {c.status === "closed" && <Badge color="gray">Da dong</Badge>}
                    {selfPendingCount > 0 && user?.role === "admin" && (
                      <Badge color="yellow"><Clock size={12} className="mr-1" />{selfPendingCount} cho duyet QR</Badge>
                    )}
                  </div>
                  {c.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{c.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                    <span>Moi nguoi: <b className="text-gray-900 dark:text-white">{formatVND(c.amountPerPerson)}</b></span>
                    {c.deadline && <span>Han nop: {formatDate(c.deadline)}</span>}
                    <span>Ti le nop: {paidCount}/{totalCount} ({pct}%)</span>
                  </div>
                  {/* Thanh tien do */}
                  <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: pct + "%" }} />
                  </div>
                </div>

                {/* Phan hanh dong */}
                <div className="flex flex-col items-end gap-2 min-w-[200px]">
                  {user?.role === "member" && my && (
                    <>
                      <Badge color={st.color}><st.icon size={12} className="mr-1" />{st.label}</Badge>
                      {my.status !== "approved" && (
                        <div className="flex gap-2 flex-wrap justify-end">
                          {/* v100: NUT TU NOP - DAY MA QR */}
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => setQrModal({ contributionId: String(my._id), amount: my.amount, title: c.title })}
                          >
                            <QrCode size={16} /> Tu nop (QR)
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => {
                            fetch(`/api/contributions/${my._id}/pay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: "Nop tien mat" }) })
                              .then((r) => r.json()).then((d) => {
                                if (d.error) toast(d.error, "error"); else { toast("Da gui yeu cau nop tien mat", "success"); load(); }
                              });
                          }}>
                            <Banknote size={16} /> Nop tien mat
                          </Button>
                        </div>
                      )}
                      {my.status === "self_pending" && my.proofImage && (
                        <button className="text-xs text-brand-600 hover:underline flex items-center gap-1" onClick={() => setProofModal(my.proofImage)}>
                          <Eye size={12} /> Xem bien lai da gui
                        </button>
                      )}
                    </>
                  )}
                  {user?.role === "admin" && (
                    <Link href={`/campaigns/${c._id}`}>
                      <Button size="sm" variant="outline"><Eye size={16} /> Chi tiet / Duyet</Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal tao dot thu (admin) */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Tao dot thu moi">
        <form onSubmit={createCampaign} className="space-y-4">
          <Input label="Tieu de dot thu" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Quy hoc ky II" required />
          <Input label="Mo ta" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Muc dich thu quy" />
          <Input label="So tien moi nguoi (VND)" type="number" value={form.amountPerPerson} onChange={(e) => setForm({ ...form, amountPerPerson: e.target.value })} placeholder="100000" required />
          <Input label="Han nop" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {creating ? "Dang tao..." : "Tao dot thu"}
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
      <Modal open={!!proofModal} onClose={() => setProofModal(null)} title="Anh bien lai">
        {proofModal?.startsWith("data:") || proofModal?.startsWith("http") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={proofModal} alt="Bien lai" className="w-full rounded-lg" />
        ) : (
          <div className="text-gray-500">Khong co anh</div>
        )}
      </Modal>
    </AppShell>
  );
}
