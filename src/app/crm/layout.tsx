import type { Metadata } from "next";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "SFG Player CRM",
  description: "מערכת CRM פנימית לסוכנות שחקנים",
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" lang="he" className="min-h-full flex">
      <AppShell>{children}</AppShell>
    </div>
  );
}
