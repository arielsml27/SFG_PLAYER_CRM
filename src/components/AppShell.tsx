"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPrintable = pathname?.endsWith("/export");

  if (isPrintable) {
    return <main className="min-h-full w-full">{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8">{children}</main>
    </>
  );
}
