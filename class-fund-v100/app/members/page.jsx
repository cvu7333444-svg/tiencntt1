"use client";
import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Card, Button, Badge, Modal, Input, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { formatVND } from "@/lib/format";
import { Plus, Users, Loader2 } from "lucide-react";
import { useI18n } from "@/components/Providers";

export default function MembersPage() {
  const toast = useToast();
  const { t } = useI18n();
  const [members, setMembers] = useState(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", studentId: "", email: "", password: "", phone: "" });

  const load = () => {
    fetch("/api/members").then((r) => r.json()).then((d) => setMembers(d.members || [])).catch(() => {});
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const r = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast(t("members.addSuccess"), "success");
      setOpen(false);
      setForm({ name: "", studentId: "", email: "", password: "", phone: "" });
      load();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setCreating(false);
    }
  };

  if (!members) return <AppShell><div className="flex justify-center py-20"><Spinner size={40} /></div></AppShell>;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("members.title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("members.count", { count: members.length })}</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={16} /> {t("members.add")}</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4">{t("members.student")}</th>
                <th className="py-2 pr-4">{t("members.studentId")}</th>
                <th className="py-2 pr-4">{t("members.email")}</th>
                <th className="py-2 pr-4">{t("members.paid")}</th>
                <th className="py-2">{t("members.remaining")}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={String(m.id)} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{m.name}</td>
                  <td className="py-3 pr-4">{m.studentId || "—"}</td>
                  <td className="py-3 pr-4 text-gray-500">{m.email}</td>
                  <td className="py-3 pr-4 text-green-600 font-medium">{formatVND(m.paid)}</td>
                  <td className="py-3 text-red-600 font-medium">{formatVND(m.pending)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t("members.add")}>
        <form onSubmit={submit} className="space-y-3">
          <Input label={t("members.fullName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("members.studentId")} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
          <Input label={t("members.email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label={t("members.password")} type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <Input label={t("members.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
            {creating ? t("members.adding") : t("members.add")}
          </Button>
        </form>
      </Modal>
    </AppShell>
  );
}
