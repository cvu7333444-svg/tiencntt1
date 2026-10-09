"use client";

import React, { useState } from "react";
import { Headset, MessageCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Modal } from "@/components/ui";
import { useAuth, useI18n } from "@/components/Providers";

const ZALO_PHONE = "0358652123";
const ZALO_PROFILE_URL = `https://zalo.me/${ZALO_PHONE}`;

export default function StudentSupportButton() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const isStudent = user?.role === "member" || user?.role === "student";

  if (!isStudent) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("support.button")}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/30 transition hover:scale-105 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 lg:bottom-6 lg:right-6"
      >
        <Headset size={24} />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t("support.title")}>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("support.description")}
          </p>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700">
            <QRCodeSVG value={ZALO_PROFILE_URL} size={220} level="M" includeMargin />
          </div>
          <a
            href={ZALO_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <MessageCircle size={16} />
            {t("support.open")}
          </a>
        </div>
      </Modal>
    </>
  );
}
