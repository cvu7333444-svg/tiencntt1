"use client";
import React, { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Upload, Loader2, QrCode, Banknote, Clock, ShieldCheck } from "lucide-react";
import { Modal, Button, Spinner } from "./ui";
import { useToast } from "./Toast";
import { formatVND } from "@/lib/format";
import { getBankName } from "@/lib/banks";
import { useI18n } from "@/components/Providers";

// ============================================================
// v100: QRPayModal — Modal "Tu nop quy" voi ma QR VietQR
// Su dung: <QRPayModal open contributionId amount onClose onSuccess />
// Luong: Hien QR (prefill so tien + noi dung CK) -> SV chuyen khoan ->
//        upload bien lai -> goi /api/contributions/:id/selfpay -> cho duyet
// ============================================================
export default function QRPayModal({ open, contributionId, amount, title, onClose, onSuccess }) {
  const toast = useToast();
  const { t } = useI18n();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proofImage, setProofImage] = useState(null); // dataUrl
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1); // 1 = hien QR, 2 = upload bien lai, 3 = thanh cong
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open || !contributionId) return;
    setStep(1);
    setProofImage(null);
    setImgError(false);
    setLoading(true);
    fetch(`/api/qr?contributionId=${contributionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setQrData(d);
        // Neu da tu nop roi -> thong bao
        if (d.contribution?.status === "self_pending") {
          setStep(3);
        }
      })
      .catch((e) => toast(e.message || t("qr.loadError"), "error"))
      .finally(() => setLoading(false));
  }, [open, contributionId, toast, t]);

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast(t("qr.fileTooLarge"), "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      // Resize nho lai de tranh tran MongoDB
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 1024;
        let { width, height } = img;
        if (width > max || height > max) {
          const r = Math.min(max / width, max / height);
          width = Math.round(width * r);
          height = Math.round(height * r);
        }
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        setProofImage(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const submitSelfPay = async () => {
    if (!proofImage) {
      toast(t("qr.receiptRequired"), "error");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(`/api/contributions/${contributionId}/selfpay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofImage, note: "Tu chuyen khoan qua QR VietQR" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Loi xac nhan");
      toast(d.message || t("qr.submitSuccess"), "success");
      setStep(3);
      onSuccess && onSuccess();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("qr.title")} wide>
      {loading ? (
        <div className="flex flex-col items-center py-10 gap-3">
          <Spinner />
          <span className="text-sm text-gray-500">{t("qr.loading")}</span>
        </div>
      ) : !qrData ? (
        <div className="text-center py-8 text-gray-500">{t("qr.loadError")}</div>
      ) : (
        <div className="space-y-5">
          {/* Buoc 3: Da gui xac nhan */}
          {step === 3 ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
                <Clock size={32} className="text-yellow-600 dark:text-yellow-300" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t("qr.successTitle")}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t("qr.successDescription")}
                </p>
              </div>
              {proofImage && (
                <div className="max-w-xs mx-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={proofImage} alt="Bien lai" className="rounded-lg border border-gray-200 dark:border-gray-700 w-full" />
                  <p className="text-xs text-gray-400 mt-1">{t("qr.receiptSent")}</p>
                </div>
              )}
              <Button onClick={onClose}>{t("qr.close")}</Button>
            </div>
          ) : (
            <>
              {/* Thong tin khoan nop */}
              <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-brand-700 dark:text-brand-300 font-medium uppercase tracking-wide">{t("qr.amountDue")}</div>
                  <div className="text-2xl font-bold text-brand-700 dark:text-brand-200 mt-0.5">{formatVND(amount || qrData.amount)}</div>
                  {title && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{title}</div>}
                </div>
                <QrCode size={40} className="text-brand-500" />
              </div>

              {step === 1 && (
                <>
                  {/* Ma QR */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-sm">
                      {!imgError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrData.imageUrl}
                          alt={t("qr.imageAlt")}
                          width={220}
                          height={220}
                          className="w-[220px] h-[220px]"
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <QRCodeSVG value={qrData.napasString} size={220} level="M" includeMargin={false} />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
                      {t("qr.scanHint")}
                    </p>
                  </div>

                  {/* Thong tin ngan hang */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{t("qr.bank")}</span>
                      <span className="max-w-[70%] text-right font-medium text-gray-900 dark:text-white">
                        {getBankName(qrData.bank.bin)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">{t("qr.accountNumber")}</span>
                      <button onClick={() => copyText(qrData.bank.accountNumber)} className="flex items-center gap-1 font-medium text-gray-900 dark:text-white hover:text-brand-600">
                        {qrData.bank.accountNumber} {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{t("qr.accountHolder")}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{qrData.bank.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">{t("qr.transferNote")}</span>
                      <button onClick={() => copyText(qrData.transferNote)} className="flex items-center gap-1 font-mono text-xs font-medium text-brand-600 dark:text-brand-300 hover:underline max-w-[60%] text-right">
                        {qrData.transferNote} {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={onClose}>{t("qr.later")}</Button>
                    <Button variant="success" className="flex-1" onClick={() => setStep(2)}>
                      <Banknote size={16} /> {t("qr.transferred")}
                    </Button>
                  </div>
                </>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-brand-400 transition-colors" onClick={() => fileRef.current?.click()}>
                    <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
                    {proofImage ? (
                      <div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={proofImage} alt="Bien lai" className="max-h-48 mx-auto rounded-lg" />
                        <p className="text-xs text-gray-500 mt-2">{t("qr.chooseAgain")}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Upload size={32} />
                        <span className="text-sm">{t("qr.uploadReceipt")}</span>
                        <span className="text-xs">{t("qr.openCamera")}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <ShieldCheck size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span>{t("qr.securityHint")}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={submitting}>{t("qr.back")}</Button>
                    <Button variant="success" className="flex-1" onClick={submitSelfPay} disabled={submitting || !proofImage}>
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      {submitting ? t("qr.submitting") : t("qr.confirmPaid")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
