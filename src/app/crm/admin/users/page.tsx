import { redirect } from "next/navigation";
import { db } from "@/db";
import { crmUsers, userPlayerAssignments, players } from "@/db/schema";
import { getCurrentCrmUser } from "@/lib/current-user";
import { createCrmUser, deleteCrmUser, updateUserPlayerAssignments } from "@/lib/admin-actions";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { Trash2, Plus } from "lucide-react";

const ROLE_LABELS: Record<string, string> = { ADMIN: "מנהל (רואה הכל)", AGENT: "סוכן (רואה שחקנים משויכים)" };

export default async function AdminUsersPage() {
  const currentUser = await getCurrentCrmUser();
  if (!currentUser) redirect("/crm-login");
  if (currentUser.role !== "ADMIN") redirect("/crm");

  const [allUsers, allAssignments, allPlayers] = await Promise.all([
    db.select().from(crmUsers).orderBy(crmUsers.email),
    db.select().from(userPlayerAssignments),
    db.select({ id: players.id, firstName: players.firstName, lastName: players.lastName }).from(players).orderBy(players.firstName),
  ]);

  const assignmentsByUser = new Map<string, Set<string>>();
  for (const a of allAssignments) {
    if (!assignmentsByUser.has(a.userId)) assignmentsByUser.set(a.userId, new Set());
    assignmentsByUser.get(a.userId)!.add(a.playerId);
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">משתמשים והרשאות</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          "מנהל" רואה את כל השחקנים. "סוכן" רואה רק שחקנים ששויכו לו.
        </p>
      </div>

      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-sm flex items-center gap-2" style={{ color: "var(--navy)" }}>
          <Plus size={15} />
          משתמש חדש
        </summary>
        <form action={createCrmUser} className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="field-label">שם</label>
            <input name="name" className="input" />
          </div>
          <div>
            <label className="field-label">אימייל *</label>
            <input type="email" name="email" required className="input" />
          </div>
          <div>
            <label className="field-label">סיסמה *</label>
            <input type="text" name="password" required className="input" placeholder="תיתן לו סיסמה, הוא יוכל לשנות בעתיד" />
          </div>
          <div>
            <label className="field-label">הרשאה</label>
            <select name="role" defaultValue="AGENT" className="input">
              <option value="AGENT">סוכן (רואה שחקנים משויכים)</option>
              <option value="ADMIN">מנהל (רואה הכל)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn btn-gold btn-sm">
              הוסף משתמש
            </button>
          </div>
        </form>
      </details>

      <div className="space-y-3">
        {allUsers.map((u) => {
          const assigned = assignmentsByUser.get(u.id) ?? new Set<string>();
          return (
            <div key={u.id} className="card p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold">
                    {u.name || u.email} {u.id === currentUser.id && <span className="text-xs" style={{ color: "var(--muted)" }}>(אתה)</span>}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {u.email} · {ROLE_LABELS[u.role] ?? u.role}
                    {u.role === "AGENT" && ` · ${assigned.size} שחקנים משויכים`}
                  </div>
                </div>
                {u.id !== currentUser.id && (
                  <form action={deleteCrmUser.bind(null, u.id)}>
                    <ConfirmSubmitButton confirmMessage={`למחוק את ${u.name || u.email}?`} className="btn btn-outline btn-sm">
                      <Trash2 size={13} />
                      מחיקה
                    </ConfirmSubmitButton>
                  </form>
                )}
              </div>

              {u.role === "AGENT" && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm hover:underline" style={{ color: "var(--gold)" }}>
                    שיוך שחקנים
                  </summary>
                  <form action={updateUserPlayerAssignments.bind(null, u.id)} className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-72 overflow-y-auto p-2 rounded-md" style={{ background: "var(--surface-2)" }}>
                      {allPlayers.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="playerIds" value={p.id} defaultChecked={assigned.has(p.id)} />
                          {p.firstName} {p.lastName}
                        </label>
                      ))}
                    </div>
                    <button type="submit" className="btn btn-gold btn-sm">
                      שמור שיוך
                    </button>
                  </form>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
