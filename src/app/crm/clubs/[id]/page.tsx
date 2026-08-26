import { notFound } from "next/navigation";
import Link from "next/link";
import { getClubDetail, getAllClubs, getAllCrmUsers, getPlayerPickerList } from "@/lib/data";
import { updateClub, addClubContact, deleteClubContact, deleteClub } from "@/lib/club-actions";
import { createRequest, updateRequest, deleteRequest, addProposedPlayer, removeProposedPlayer } from "@/lib/request-actions";
import { getCurrentCrmUser } from "@/lib/current-user";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import ClubForm from "@/components/ClubForm";
import RequestForm from "@/components/RequestForm";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { Plus, Trash2, X, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

function toneFor(status: string): string {
  return status === "OPEN" ? "badge-ok" : "badge-neutral";
}

function playerName(p: { firstName: string | null; lastName: string | null; fullNameHebrew: string | null } | undefined) {
  if (!p) return "—";
  return p.fullNameHebrew || [p.firstName, p.lastName].filter(Boolean).join(" ") || "—";
}

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, clubOptions, users, playerOptions, currentUser] = await Promise.all([
    getClubDetail(id),
    getAllClubs(),
    getAllCrmUsers(),
    getPlayerPickerList(),
    getCurrentCrmUser(),
  ]);

  if (!detail) notFound();
  const { club, contacts, requests } = detail;
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <div className="max-w-5xl space-y-5">
      <div className="card p-4 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-lg overflow-hidden border shrink-0 flex items-center justify-center"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          {club.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={club.logoPath} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="text-[10px] text-center" style={{ color: "var(--muted)" }}>
              אין לוגו
            </span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{club.name}</h1>
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            {[club.league, club.country, club.city].filter(Boolean).join(" · ") || "—"}
          </div>
          {club.transfermarktLink && (
            <a
              href={club.transfermarktLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs flex items-center gap-1 mt-1 hover:underline"
              style={{ color: "var(--gold)" }}
            >
              <ExternalLink size={12} />
              עמוד ב-Transfermarkt
            </a>
          )}
        </div>
        {isAdmin && (
          <form action={deleteClub.bind(null, club.id)}>
            <ConfirmSubmitButton
              confirmMessage={`למחוק את ${club.name}? הפעולה תמחק גם את אנשי הקשר של המועדון ולא ניתן לבטל אותה.`}
              className="btn btn-outline btn-sm"
            >
              <Trash2 size={13} />
              מחיקת מועדון
            </ConfirmSubmitButton>
          </form>
        )}
      </div>

      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-sm" style={{ color: "var(--navy)" }}>
          עריכת פרטי מועדון
        </summary>
        <div className="mt-4">
          <ClubForm action={updateClub.bind(null, club.id)} defaultValues={club} submitLabel="שמור שינויים" />
        </div>
      </details>

      <div className="card p-4">
        <h2 className="font-semibold mb-3">אנשי קשר</h2>
        <div className="space-y-2">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 border-b pb-2 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <span className="font-medium">{c.name}</span>
                {c.role && (
                  <span className="mr-2" style={{ color: "var(--muted)" }}>
                    · {c.role}
                  </span>
                )}
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {[c.phone, c.email].filter(Boolean).join(" · ")}
                </div>
              </div>
              <form action={deleteClubContact.bind(null, club.id, c.id)}>
                <button type="submit" className="btn btn-outline btn-sm">
                  <Trash2 size={12} />
                </button>
              </form>
            </div>
          ))}
          {contacts.length === 0 && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              אין עדיין אנשי קשר
            </p>
          )}
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm flex items-center gap-1.5" style={{ color: "var(--gold)" }}>
            <Plus size={14} />
            הוסף איש קשר
          </summary>
          <form action={addClubContact.bind(null, club.id)} className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="field-label">שם *</label>
              <input name="name" required className="input" />
            </div>
            <div>
              <label className="field-label">תפקיד</label>
              <input name="role" className="input" />
            </div>
            <div>
              <label className="field-label">טלפון</label>
              <input name="phone" className="input" />
            </div>
            <div>
              <label className="field-label">אימייל</label>
              <input name="email" className="input" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn btn-gold btn-sm">
                הוסף
              </button>
            </div>
          </form>
        </details>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-3">בקשות</h2>
        <div className="space-y-3">
          {requests.map((r) => {
            const proposedPlayerIds = new Set(r.proposedPlayers.map((x) => x.player!.id));
            const availableToPropose = playerOptions.filter((p) => !proposedPlayerIds.has(p.id));
            return (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm" style={{ color: "var(--muted)" }}>
                    {r.positionSought ? `מחפשים: ${r.positionSought}` : "—"}
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
                        <button type="submit" className="badge badge-neutral flex items-center gap-1" style={{ cursor: "pointer" }}>
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
                      <RequestForm
                        action={updateRequest.bind(null, r.id)}
                        users={users}
                        clubOptions={clubOptions}
                        defaultValues={r}
                        submitLabel="שמור שינויים"
                      />
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
          {requests.length === 0 && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              אין עדיין בקשות למועדון הזה
            </p>
          )}
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm flex items-center gap-1.5" style={{ color: "var(--gold)" }}>
            <Plus size={14} />
            בקשה חדשה למועדון הזה
          </summary>
          <div className="mt-3">
            <RequestForm
              action={createRequest}
              users={users}
              clubOptions={clubOptions}
              lockedClub={{ id: club.id, name: club.name }}
              submitLabel="הוסף"
            />
          </div>
        </details>
      </div>

      <Link href="/crm/clubs" className="text-sm hover:underline" style={{ color: "var(--gold)" }}>
        חזרה לרשימת המועדונים
      </Link>
    </div>
  );
}
