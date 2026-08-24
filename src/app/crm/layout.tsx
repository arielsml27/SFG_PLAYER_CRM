import type { Metadata } from "next";
import AppShell from "@/components/AppShell";
import { getCurrentCrmUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "SFG Player CRM",
  description: "מערכת CRM פנימית לסוכנות שחקנים",
};

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentCrmUser();
  const userInfo = currentUser ? { name: currentUser.name, email: currentUser.email, role: currentUser.role } : null;

  return (
    <div dir="rtl" lang="he" className="min-h-full flex">
      <AppShell currentUser={userInfo}>{children}</AppShell>
    </div>
  );
}
