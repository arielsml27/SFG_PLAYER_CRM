"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Users, LayoutDashboard, ListChecks, Building2, Plus, LogOut, ShieldCheck } from "lucide-react";
import { crmLogout } from "@/lib/crm-auth-actions";

const NAV = [
  { href: "/crm", label: "דשבורד", icon: LayoutDashboard },
  { href: "/crm/players", label: "שחקנים", icon: Users },
  { href: "/crm/tasks", label: "משימות", icon: ListChecks },
  { href: "/crm/clubs", label: "מועדונים", icon: Building2 },
];

type CurrentUserInfo = { name: string | null; email: string; role: string } | null;

export default function Sidebar({ currentUser }: { currentUser?: CurrentUserInfo }) {
  const pathname = usePathname();
  const nav = currentUser?.role === "ADMIN" ? [...NAV, { href: "/crm/admin/users", label: "משתמשים", icon: ShieldCheck }] : NAV;

  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-screen sticky top-0"
      style={{ background: "var(--sidebar-bg)", color: "var(--sidebar-fg)" }}
    >
      <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
        <Image
          src="/logo-icon.png"
          alt="SFG"
          width={38}
          height={38}
          className="rounded-xl w-[38px] h-[38px]"
        />
        <div>
          <div className="text-lg font-bold text-white leading-tight">SFG</div>
          <div className="text-[11px]" style={{ color: "var(--gold)" }}>
            Player CRM
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/crm" ? pathname === "/crm" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? "" : "hover:bg-white/10"
              }`}
              style={active ? { background: "var(--gold)", color: "#06280c" } : undefined}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <Link
          href="/crm/players/new"
          className="btn btn-gold w-full justify-center"
        >
          <Plus size={16} />
          שחקן חדש
        </Link>
      </div>

      {currentUser && (
        <div className="px-5 py-2 border-t border-white/10">
          <div className="text-sm font-medium text-white truncate">{currentUser.name || currentUser.email}</div>
          <div className="text-[11px] text-white/40">{currentUser.role === "ADMIN" ? "מנהל" : "סוכן"}</div>
        </div>
      )}
      <div className="px-3 py-3 border-t border-white/10">
        <form action={crmLogout}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium w-full text-white/60 hover:bg-white/10 hover:text-white/90 transition-colors"
          >
            <LogOut size={17} />
            <span>התנתקות</span>
          </button>
        </form>
      </div>
      <div className="px-5 py-3 text-[11px] text-white/40 border-t border-white/10">
        עובד מקומית · SQLite
      </div>
    </aside>
  );
}
