"use client";
import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, Button, Input, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Settings as SettingsIcon, Save, Loader2, QrCode, Info } from "lucide-react";

// v100: Trang cai dat — cau hinh thong tin ngan hang quy de sinh ma QR tu nop
export default function SettingsPage() {
  const toast = useToast();
  const [form, setForm] = useState({ bin: "", accountNumber: "", accountName: "", accountHolder: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.fundBank) setForm(d.fundBank);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast("Da luu cau hinh ngan hang. Ma QR tu nop se dung thong tin moi.", "success");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AppShell><div className="flex justify-center py-20"><Spinner size={40} /></div></AppShell>;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <SettingsIcon size={24} /> Cai dat
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Cau hinh thong tin ngan hang cua quy de sinh vien <b>tu nop qua ma QR</b></p>

      <Card className="max-w-xl">
        <div className="flex items-center gap-2 mb-4 text-sm text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/20 p-3 rounded-lg">
          <QrCode size={16} className="flex-shrink-0" />
          <span>Thong tin nay se duoc dung de tao ma QR VietQR khi sinh vien chon "Tu nop (QR)".</span>
        </div>
        <form onSubmit={save} className="space-y-4">
          <Input label="Ma ngan hang (BIN)" value={form.bin} onChange={(e) => setForm({ ...form, bin: e.target.value })} placeholder="970422 (MB Bank)" required />
          <div className="text-xs text-gray-400 -mt-2 flex items-start gap-1">
            <Info size={12} className="flex-shrink-0 mt-0.5" />
            BIN pho bien: VCB=970415, MB=970422, Techcombank=970407, VietinBank=970416, BIDV=970418, ACB=970416, Agribank=970405
          </div>
          <Input label="So tai khoan quy" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="0123456789" required />
          <Input label="Ten tai khoan (hien thi tren QR)" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} placeholder="QUY LOP 12A1" />
          <Input label="Chu tai khoan" value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} placeholder="NGUYEN VAN A" />
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Dang luu..." : "Luu cau hinh"}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
