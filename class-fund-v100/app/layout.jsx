import "./globals.css";
import { AuthProvider, ThemeProvider } from "@/components/Providers";
import { ToastProvider } from "@/components/Toast";
import PWARegister from "@/components/PWARegister";

export const metadata = {
  title: "Quan ly Tien quy Lop hoc - v100",
  description: "He thong quan ly tien quy lop hoc, tu nop qua ma QR VietQR",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
              <PWARegister />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
