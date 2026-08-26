import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" dir="ltr" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
