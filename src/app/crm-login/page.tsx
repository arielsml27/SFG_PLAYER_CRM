import Image from "next/image";
import { crmLogin } from "@/lib/crm-auth-actions";

export default async function CrmLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div
      dir="rtl"
      lang="he"
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <form action={crmLogin} className="card w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <Image src="/logo-icon.png" alt="SFG" width={36} height={36} className="rounded-xl w-9 h-9" />
          <div>
            <div className="font-bold leading-tight">SFG</div>
            <div className="text-xs" style={{ color: "var(--gold)" }}>
              Player CRM
            </div>
          </div>
        </div>
        <h1 className="text-lg font-bold mb-1">כניסה למערכת</h1>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          אזור פנימי לצוות בלבד.
        </p>
        <input type="hidden" name="next" value={next ?? "/crm"} />
        <input type="email" name="email" placeholder="אימייל" required autoFocus className="input w-full mb-3" />
        <input type="password" name="password" placeholder="סיסמה" required className="input w-full mb-3" />
        {error && (
          <div className="text-sm mb-3" style={{ color: "var(--danger)" }}>
            אימייל או סיסמה שגויים, נסה שוב.
          </div>
        )}
        <button type="submit" className="btn btn-gold w-full justify-center">
          כניסה
        </button>
      </form>
    </div>
  );
}
