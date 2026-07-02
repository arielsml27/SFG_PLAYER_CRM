import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "SFG Player CRM",
  description: "מערכת CRM פנימית לסוכנות שחקנים",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
