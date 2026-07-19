import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SFG OS — Football Career Operating System",
  description: "Manage your football career. All in one place.",
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
