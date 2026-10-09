import "./globals.css";
import { AuthProvider, I18nProvider, ThemeProvider } from "@/components/Providers";
import { ToastProvider } from "@/components/Toast";
import PWARegister from "@/components/PWARegister";

export const metadata = {
  title: "Quan ly Tien quy Lop hoc - v100",
  description: "He thong quan ly tien quy lop hoc, tu nop qua ma QR VietQR",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <ToastProvider>
                {children}
                <PWARegister />
              </ToastProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
