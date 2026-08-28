import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Samuel · ניהול",
  description: "מערכת ניהול הזמנות, לקוחות ותמחור",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
