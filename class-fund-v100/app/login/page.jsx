"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Loader2 } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/components/Providers";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Vui long nhap day du thong tin"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Dang nhap that bai");
      login(d.user);
      toast("Dang nhap thanh cong", "success");
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-500 to-brand-800 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-600 text-white flex items-center justify-center mb-3">
            <Wallet size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quan ly Quy Lop</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dang nhap de quan ly tien quy lop hoc</p>
          <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 font-medium">v100 - Tu nop qua QR</span>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sv100@class.edu" autoComplete="email" />
          <Input label="Mat khau" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" autoComplete="current-password" />
          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300 p-2 rounded-lg">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? "Dang dang nhap..." : "Dang nhap"}
          </Button>
        </form>
        <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div><b>Admin:</b> thuquy@class.edu / admin123</div>
          <div><b>Sinh vien:</b> sv100@class.edu → sv104@class.edu / 123456</div>
        </div>
      </Card>
    </div>
  );
}
