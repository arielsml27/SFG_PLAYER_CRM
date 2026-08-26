import { getRequests, getAllCrmUsers, getPlayerPickerList } from "@/lib/data";
import { createRequest, updateRequest, deleteRequest, addProposedPlayer, removeProposedPlayer } from "@/lib/request-actions";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import RequestForm from "@/components/RequestForm";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { Plus, Trash2, X } from "lucide-react";

function toneFor(status: string): string {
  return status === "OPEN" ? "badge-ok" : "badge-neutral";
}

function playerName(p: { firstName: string | null; lastName: string | null; fullNameHebrew: string | null } | undefined) {
  if (!p) return "—";
  return p.fullNameHebrew || [p.firstName, p.lastName].filter(Boolean).join(" ") || "—";
}

export default async function RequestsPage() {
  const [requestList, users, playerOptions] = await Promise.all([getRequests(), getAllCrmUsers(), getPlayerPickerList()]);

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">בקשות</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {requestList.length} בקשות
        </p>
      </div>

      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-sm flex items-center gap-2" style={{ color: "var(--navy)" }}>
          <Plus size={15} />
          בקשה חדשה
        </summary>
        <div className="mt-4">
          <RequestForm action={createRequest} users={users} submitLabel="הוסף" />
        </div>
      </details>

      <div className="space-y-3">
        {requestList.map((r) => {
          const proposedPlayerIds = new Set(r.proposedPlayers.map((x) => x.player!.id));
          const availableToPropose = playerOptions.filter((p) => !proposedPlayerIds.has(p.id));
          return (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold">
                    {[r.club, r.league, r.country].filter(Boolean).join(" · ") || "בקשה ללא פרטי קבוצה"}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {r.positionSought ? `מחפשים: ${r.positionSought}` : "—"}
                  </div>
                </div>
                <span className={`badge ${toneFor(r.status)}`}>{REQUEST_STATUS_LABELS[r.status] ?? r.status}</span>
              </div>

              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm mt-3">
                <div className="flex justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
                  <dt style={{ color: "var(--muted)" }}>תקציב להעברה</dt>
                  <dd className="font-medium">{r.transferBudget ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
                  <dt style={{ color: "var(--muted)" }}>תקציב שכר לשחקן</dt>
                  <dd className="font-medium">{r.salaryBudget ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
                  <dt style={{ color: "var(--muted)" }}>מי מטפל</dt>
                  <dd className="font-medium">{r.handledBy ? r.handledBy.name || r.handledBy.email : "—"}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
                  <dt style={{ color: "var(--muted)" }}>שותף לעסקה</dt>
                  <dd className="font-medium">{r.dealPartner ?? "—"}</dd>
                </div>
                {r.notes && (
                  <div className="flex justify-between gap-3 border-b pb-1 md:col-span-2" style={{ borderColor: "var(--border)" }}>
                    <dt style={{ color: "var(--muted)" }}>הערות</dt>
                    <dd className="font-medium whitespace-pre-wrap text-right">{r.notes}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-3">
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>
                  שחקנים שכבר הצענו
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.proposedPlayers.map((x) => (
                    <form key={x.linkId} action={removeProposedPlayer.bind(null, r.id, x.player!.id)}>
                      <button
                        type="submit"
                        className="badge badge-neutral flex items-center gap-1"
                        style={{ cursor: "pointer" }}
                      >
                        {playerName(x.player)}
                        <X size={11} />
                      </button>
                    </form>
                  ))}
                  {r.proposedPlayers.length === 0 && (
                    <span className="text-sm" style={{ color: "var(--muted)" }}>
                      עדיין לא הוצעו שחקנים
                    </span>
                  )}
                </div>
                {availableToPropose.length > 0 && (
                  <form action={addProposedPlayer.bind(null, r.id)} className="flex items-center gap-2 mt-2">
                    <select name="playerId" className="input" defaultValue="">
                      <option value="" disabled>
                        הוסף שחקן שהוצע
                      </option>
                      {availableToPropose.map((p) => (
                        <option key={p.id} value={p.id}>
                          {playerName(p)}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="btn btn-outline btn-sm shrink-0">
                      הוסף
                    </button>
                  </form>
                )}
              </div>

              <div className="flex items-center justify-between mt-3">
                <details>
                  <summary className="cursor-pointer text-sm hover:underline" style={{ color: "var(--gold)" }}>
                    עריכה
                  </summary>
                  <div className="mt-3">
                    <RequestForm action={updateRequest.bind(null, r.id)} users={users} defaultValues={r} submitLabel="שמור שינויים" />
                  </div>
                </details>
                <form action={deleteRequest.bind(null, r.id)}>
                  <ConfirmSubmitButton confirmMessage="למחוק את הבקשה?" className="btn btn-outline btn-sm">
                    <Trash2 size={13} />
                    מחיקה
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          );
        })}
        {requestList.length === 0 && (
          <div className="card p-8 text-center text-sm" style={{ color: "var(--muted)" }}>
            אין בקשות עדיין
          </div>
        )}
      </div>
    </div>
  );
}
