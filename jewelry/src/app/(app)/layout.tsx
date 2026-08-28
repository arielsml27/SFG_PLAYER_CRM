import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { currentUser } from "@/lib/session";
import { navCounts } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const counts = await navCounts();

  return (
    <div className="shell">
      <Sidebar counts={counts} userName={user.name} />
      <main className="main">{children}</main>
    </div>
  );
}
