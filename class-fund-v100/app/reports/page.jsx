"use client";
import React from "react";
import AppShell from "@/components/AppShell";
import { Card, Button } from "@/components/ui";
import { FileSpreadsheet, FileText, Download } from "lucide-react";
import { useI18n } from "@/components/Providers";

export default function ReportsPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t("reports.title")}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="flex flex-col items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 dark:bg-green-900/40 flex items-center justify-center">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Excel (.xlsx)</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("reports.excel")}</p>
          </div>
          <a href="/api/reports/export?format=excel" download>
            <Button variant="success"><Download size={16} /> {t("reports.downloadExcel")}</Button>
          </a>
        </Card>
        <Card className="flex flex-col items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">PDF</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("reports.pdf")}</p>
          </div>
          <a href="/api/reports/export?format=pdf" download>
            <Button variant="danger"><Download size={16} /> {t("reports.downloadPdf")}</Button>
          </a>
        </Card>
      </div>
    </AppShell>
  );
}
