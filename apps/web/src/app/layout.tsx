import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";

import { PwaRegister } from "@/components/pwa-register";
import { QueryProvider } from "@/components/query-provider";
import { RealtimeListener } from "@/components/realtime-listener";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Inventory Management System",
  description: "Realtime inventory, warehouse, orders, returns, analytics, and RBAC dashboard.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <AuthProvider>
              <RealtimeListener />
              {children}
            </AuthProvider>
          </QueryProvider>
          <Toaster richColors position="top-right" />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
