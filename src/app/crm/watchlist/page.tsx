import { getProspects, getAllCrmUsers } from "@/lib/data";
import { createProspect, updateProspect, deleteProspect } from "@/lib/prospect-actions";
import { PROSPECT_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import ProspectForm from "@/components/ProspectForm";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { Plus, Trash2 } from "lucide-react";

function toneFor(status: string): string {
  if (status === "MEETING_SCHEDULED") return "badge-ok";
  if (status === "CONTACTED_NO_MEETING") return "badge-warn";
  return "badge-neutral";
}

export default async function WatchlistPage() {
  const [prospectsList, users] = await Promise.all([getProspects(), getAllCrmUsers()]);
  const userById = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">שחקנים למעקב</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {prospectsList.length} שחקנים במעקב
        </p>
      </div>

      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-sm flex items-center gap-2" style={{ color: "var(--navy)" }}>
          <Plus size={15} />
          שחקן חדש למעקב
        </summary>
        <div className="mt-4">
          <ProspectForm action={createProspect} users={users} submitLabel="הוסף" />
        </div>
      </details>

      <div className="space-y-3">
        {prospectsList.map((p) => {
          const contactedBy = p.contactedByUserId ? userById.get(p.contactedByUserId) : undefined;
          return (
            <div key={p.id} className="card p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {[p.club, p.position, p.age ? `גיל ${p.age}` : null].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <span className={`badge ${toneFor(p.status)}`}>{PROSPECT_STATUS_LABELS[p.status] ?? p.status}</span>
              </div>

              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm mt-3">
                <div className="flex justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
                  <dt style={{ color: "var(--muted)" }}>טלפון הורה</dt>
                  <dd className="font-medium">{p.parentPhone ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
                  <dt style={{ color: "var(--muted)" }}>מי פנה</dt>
                  <dd className="font-medium">{contactedBy ? contactedBy.name || contactedBy.email : "—"}</dd>
                </div>
                {p.status === "MEETING_SCHEDULED" && (
                  <>
                    <div className="flex justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
                      <dt style={{ color: "var(--muted)" }}>מועד פגישה</dt>
                      <dd className="font-medium">
                        {p.meetingDate ? formatDate(p.meetingDate) : "—"} {p.meetingTime ?? ""}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
                      <dt style={{ color: "var(--muted)" }}>מיקום</dt>
                      <dd className="font-medium">{p.meetingLocation ?? "—"}</dd>
                    </div>
                  </>
                )}
              </dl>

              <div className="flex items-center justify-between mt-3">
                <details>
                  <summary className="cursor-pointer text-sm hover:underline" style={{ color: "var(--gold)" }}>
                    עריכה
                  </summary>
                  <div className="mt-3">
                    <ProspectForm action={updateProspect.bind(null, p.id)} users={users} defaultValues={p} submitLabel="שמור שינויים" />
                  </div>
                </details>
                <form action={deleteProspect.bind(null, p.id)}>
                  <ConfirmSubmitButton confirmMessage={`למחוק את ${p.name} מהמעקב?`} className="btn btn-outline btn-sm">
                    <Trash2 size={13} />
                    מחיקה
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          );
        })}
        {prospectsList.length === 0 && (
          <div className="card p-8 text-center text-sm" style={{ color: "var(--muted)" }}>
            אין שחקנים במעקב עדיין
          </div>
        )}
      </div>
    </div>
  );
}
