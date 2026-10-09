"use client";
import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, Button, Input, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Landmark, Save, Loader2, QrCode, Info } from "lucide-react";
import { useI18n } from "@/components/Providers";

export default function BankSettingsPage() {
  const toast = useToast();
  const { t } = useI18n();
  const [form, setForm] = useState({ bin: "", accountNumber: "", accountName: "", accountHolder: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || t("settings.loadError"));
        if (result.fundBank) setForm(result.fundBank);
      })
      .catch((error) => toast(error.message || t("settings.loadError"), "error"))
      .finally(() => setLoading(false));
  }, [t, toast]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t("settings.saveError"));
      toast(t("settings.saved"), "success");
    } catch (error) {
      toast(error.message || t("settings.saveError"), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AppShell><div className="flex justify-center py-20"><Spinner size={40} /></div></AppShell>;
  }

  return (
    <AppShell>
      <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
        <Landmark size={24} /> {t("settings.bankTitle")}
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{t("settings.description")}</p>

      <Card className="max-w-xl">
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
          <QrCode size={16} className="flex-shrink-0" />
          <span>{t("settings.bankInfo")}</span>
        </div>
        <form onSubmit={save} className="space-y-4">
          <Input label={t("settings.bankBin")} value={form.bin} onChange={(event) => setForm({ ...form, bin: event.target.value })} placeholder="970422 (MB Bank)" required />
          <div className="-mt-2 flex items-start gap-1 text-xs text-gray-400">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            {t("settings.commonBins")}
          </div>
          <Input label={t("settings.accountNumber")} value={form.accountNumber} onChange={(event) => setForm({ ...form, accountNumber: event.target.value })} placeholder="0123456789" required />
          <Input label={t("settings.accountName")} value={form.accountName} onChange={(event) => setForm({ ...form, accountName: event.target.value })} placeholder="QUY LOP 12A1" />
          <Input label={t("settings.accountHolder")} value={form.accountHolder} onChange={(event) => setForm({ ...form, accountHolder: event.target.value })} placeholder="NGUYEN VAN A" />
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? t("settings.saving") : t("settings.save")}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
