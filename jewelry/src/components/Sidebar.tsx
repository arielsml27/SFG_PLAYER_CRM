"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";

type Counts = { orders: number; customers: number; tasks: number; catalog: number };

const NAV = [
  { group: "יומיום", items: [
    { href: "/", label: "דשבורד", key: null as keyof Counts | null },
    { href: "/orders", label: "הזמנות", key: "orders" as const },
    { href: "/tasks", label: "משימות", key: "tasks" as const },
  ]},
  { group: "אנשים", items: [
    { href: "/customers", label: "לקוחות", key: "customers" as const },
  ]},
  { group: "מוצרים", items: [
    { href: "/catalog", label: "קטלוג", key: "catalog" as const },
    { href: "/collections", label: "קולקציות", key: null },
  ]},
  { group: "מערכת", items: [
    { href: "/settings", label: "הגדרות ושערים", key: null },
  ]},
];

export default function Sidebar({ counts, userName }: { counts: Counts; userName: string }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sidebar">
      <div className="brand">
        <Image src="/brand/samuel-logo.png" alt="Samuel" width={330} height={104} priority />
        <span className="micro">ניהול פנימי</span>
      </div>

      {NAV.map((section) => (
        <div key={section.group}>
          <div className="nav-group">{section.group}</div>
          <nav>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? "active" : undefined}
              >
                <span>{item.label}</span>
                {item.key ? <span className="count">{counts[item.key]}</span> : null}
              </Link>
            ))}
          </nav>
        </div>
      ))}

      <div className="foot">
        <span>{userName}</span>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-ghost btn-sm" style={{ width: "100%" }}>
            התנתקות
          </button>
        </form>
      </div>
    </aside>
  );
}
