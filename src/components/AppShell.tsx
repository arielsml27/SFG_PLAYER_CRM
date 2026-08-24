"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

type CurrentUserInfo = { name: string | null; email: string; role: string } | null;

export default function AppShell({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser?: CurrentUserInfo;
}) {
  const pathname = usePathname();
  const isPrintable = pathname?.endsWith("/export");

  if (isPrintable) {
    return <main className="min-h-full w-full">{children}</main>;
  }

  return (
    <>
      <Sidebar currentUser={currentUser} />
      <main className="flex-1 min-w-0 p-6 md:p-8">{children}</main>
    </>
  );
}
