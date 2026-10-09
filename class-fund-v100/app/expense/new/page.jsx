"use client";
import React, { useState, useRef } from "react";
import AppShell from "@/components/AppShell";
import { Card, Button, Input, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Upload, Loader2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/Providers";

export default function ExpenseNewPage() {
  const toast = useToast();
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({ amount: "", description: "", category: "" });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 1024;
        let { width, height } = img;
        if (width > max || height > max) {
          const r = Math.min(max / width, max / height);
          width = Math.round(width * r); height = Math.round(height * r);
        }
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        setImage(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.description) { toast(t("expense.required"), "error"); return; }
    if (!image) { toast(t("expense.receiptRequired"), "error"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/transactions/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount), image }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast(t("expense.success"), "success");
      router.push("/ledger");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t("expense.title")}</h1>
      <Card className="max-w-xl">
        <form onSubmit={submit} className="space-y-4">
          <Input label={t("expense.amount")} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="50000" required />
          <Input label={t("expense.description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t("expense.description")} required />
          <Input label={t("expense.category")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder={t("expense.category")} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("expense.receipt")}</label>
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-brand-400"
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="Hoa don" className="max-h-48 mx-auto rounded-lg" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Upload size={28} />
                  <span className="text-sm">{t("expense.uploadReceipt")}</span>
                </div>
              )}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
            {loading ? t("expense.submitting") : t("expense.submit")}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
