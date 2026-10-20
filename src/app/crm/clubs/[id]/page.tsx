import { notFound } from "next/navigation";
import Link from "next/link";
import { getClubDetail, getAllClubs, getAllCrmUsers, getPlayerPickerList } from "@/lib/data";
import { updateClub, addClubContact, updateClubContact, deleteClubContact, setClubPrimaryContact, deleteClub, addClubTeam, deleteClubTeam, addClubTeamContact, deleteClubTeamContact } from "@/lib/club-actions";
import { createRequest, updateRequest, deleteRequest, addProposedPlayer, removeProposedPlayer } from "@/lib/request-actions";
import { updateProposalSentStatus, deleteProposalSent } from "@/lib/proposal-sent-actions";
import { getCurrentCrmUser } from "@/lib/current-user";
import {
  REQUEST_STATUS_LABELS,
  RELATIONSHIP_LEVEL_LABELS,
  RELATIONSHIP_OWNER_LABELS,
  PROPOSAL_SENT_STATUSES,
  PROPOSAL_SENT_STATUS_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { LANG_NAMES, type ProposalLang } from "@/lib/proposal";
import ClubForm from "@/components/ClubForm";
import RequestForm from "@/components/RequestForm";
import ClubContactFields from "@/components/ClubContactFields";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import { Plus, Trash2, X, ExternalLink, Pencil, Star } from "lucide-react";

export const dynamic = "force-dynamic";

function toneFor(status: string): string {
  return status === "OPEN" ? "badge-ok" : "badge-neutral";
}

// 2 (אח שלי) is the strongest tie, 3 (לא מכיר) the weakest.
function relationshipTone(level: number): string {
  if (level === 2) return "badge-ok";
  if (level === 1) return "badge-gold";
  if (level === 4) return "badge-warn";
  return "badge-neutral";
}

function playerName(p: { firstName: string | null; lastName: string | null; fullNameHebrew: string | null } | undefined) {
  if (!p) return "—";
  return p.fullNameHebrew || [p.firstName, p.lastName].filter(Boolean).join(" ") || "—";
}

export default async function ClubDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ deleteError?: string }>;
}) {
  const { id } = await params;
  const { deleteError } = await searchParams;
  const [detail, clubOptions, users, playerOptions, currentUser] = await Promise.all([
    getClubDetail(id),
    getAllClubs(),
    getAllCrmUsers(),
    getPlayerPickerList(),
    getCurrentCrmUser(),
  ]);

  if (!detail) notFound();
  const { club, contacts, teams, requests, primaryContact, proposalsSent } = detail;
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <div className="max-w-5xl space-y-5">
      {deleteError && (
        <div className="card p-4 text-sm" style={{ background: "var(--danger-bg)", borderColor: "var(--danger)", color: "var(--danger)" }}>
          לא ניתן למחוק את המועדון - יש שחקנים, חוזים או עסקאות שעדיין מקושרים אליו. יש להסיר או להעביר אותם למועדון אחר קודם.
        </div>
      )}

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
          <div className="text-sm mt-1 flex items-center gap-1.5">
            <Star size={13} style={{ color: "var(--gold)" }} />
            <span style={{ color: "var(--muted)" }}>איש הקשר המקצועי שלנו:</span>
            <span className="font-medium">{primaryContact ? primaryContact.name : "לא נבחר"}</span>
            {primaryContact?.role && (
              <span style={{ color: "var(--muted)" }}>· {primaryContact.role}</span>
            )}
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
              confirmMessage={`למחוק את ${club.name}? הפעולה תמחק גם את אאשי הקשר של המועדון ולא ניתן לבטל אותה.`}
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
            <div key={c.id} className="border-b pb-2 text-sm" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-medium">{c.name}</span>
                  {c.id === club.primaryContactId && (
                    <span className="badge badge-gold mr-2">איש הקשר המקצועי שלנו</span>
                  )}
                  {c.role && (
                    <span className="mr-2" style={{ color: "var(--muted)" }}>
                      · {c.role}
                    </span>
                  )}
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {[c.phone, c.email].filter(Boolean).join(" · ")}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                    {c.relationshipLevel != null && (
                      <span className={`badge ${relationshipTone(c.relationshipLevel)}`}>
                        {RELATIONSHIP_LEVEL_LABELS[c.relationshipLevel] ?? c.relationshipLevel}
                      </span>
                    )}
                    {c.relationshipOwner && (
                      <span className="badge badge-neutral">קשר של: {RELATIONSHIP_OWNER_LABELS[c.relationshipOwner] ?? c.relationshipOwner}</span>
                    )}
                    {c.lastContactAt && (
                      <span style={{ color: "var(--muted)" }}>מגע אחרון: {formatDate(c.lastContactAt)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <details className="relative">
                    <summary className="btn btn-outline btn-sm cursor-pointer list-none">
                      <Pencil size={12} />
                    </summary>
                    <form
                      action={updateClubContact.bind(null, club.id, c.id)}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 p-3 border rounded-lg"
                      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                    >
                      <ClubContactFields defaultValues={c} />
                      <div className="md:col-span-2">
                        <button type="submit" className="btn btn-gold btn-sm">
                          שמור
                        </button>
                      </div>
                    </form>
                  </details>
                  <form action={deleteClubContact.bind(null, club.id, c.id)}>
                    <button type="submit" className="btn btn-outline btn-sm">
                      <Trash2 size={12} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              אין עדיין אנשי קשר
            </p>
          )}
        </div>

        {contacts.length > 0 && (
          <form action={setClubPrimaryContact.bind(null, club.id)} className="flex items-end gap-2 mt-4 flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <label className="field-label">איש הקשר המקצועי שלנו</label>
              <select name="primaryContactId" className="input" defaultValue={club.primaryContactId ?? ""}>
                <option value="">לא נבחר</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.role ? ` · ${c.role}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-outline btn-sm">
              שמור
            </button>
          </form>
        )}

        <details className="mt-3">
          <summary className="cursor-pointer text-sm flex items-center gap-1.5" style={{ color: "var(--gold)" }}>
            <Plus size={14} />
            הוסף איש קשר
          </summary>
          <form action={addClubContact.bind(null, club.id)} className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <ClubContactFields />
            <div className="md:col-span-2">
              <button type="submit" className="btn btn-gold btn-sm">
                הוסף
              </button>
            </div>
          </form>
        </details>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-3">הצעות שחקנים שנשלחו</h2>
        {proposalsSent.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            עדיין לא נשלחו הצעות למועדון הזה
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>שחקן</th>
                  <th>נשלח</th>
                  <th>שפה</th>
                  <th>נשלח על ידי</th>
                  <th>סטטוס</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {proposalsSent.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">
                      {p.player ? (
                        <Link href={`/crm/players/${p.player.id}`} className="hover:underline" style={{ color: "var(--gold)" }}>
                          {playerName(p.player)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{formatDate(p.sentAt)}</td>
                    <td>{p.language ? LANG_NAMES[p.language as ProposalLang] ?? p.language : "—"}</td>
                    <td>{p.sentBy ?? "—"}</td>
                    <td>
                      <form
                        action={async (fd) => {
                          "use server";
                          await updateProposalSentStatus(p.id, String(fd.get("status")));
                        }}
                      >
                        <AutoSubmitSelect
                          name="status"
                          defaultValue={p.status}
                          options={PROPOSAL_SENT_STATUSES.map((st) => ({ value: st, label: PROPOSAL_SENT_STATUS_LABELS[st] }))}
                        />
                      </form>
                    </td>
                    <td>
                      <form action={deleteProposalSent.bind(null, p.id)}>
                        <ConfirmSubmitButton confirmMessage="למחוק את הרישום של ההצעה?" className="btn btn-outline btn-sm">
                          <Trash2 size={12} />
                        </ConfirmSubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-3">תתי-קבוצות (נוער, נערים א', נערים · וכו)</h2>
        <div className="space-y-3">
          {teams.map((t) => (
            <div key={t.id} className="border rounded-lg p-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-medium">{t.name}</span>
                  {t.notes && (
                    <span className="mr-2 text-xs" style={{ color: "var(--muted)" }}>
                      · {t.notes}
                    </span>
                  )}
                </div>
                <form action={deleteClubTeam.bind(null, club.id, t.id)}>
                  <button type="submit" className="btn btn-outline btn-sm">
                    <Trash2 size={12} />
                  </button>
                </form>
              </div>

              <div className="mt-2 space-y-1.5">
                {t.contacts.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 text-sm border-t pt-1.5"
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
                    <form action={deleteClubTeamContact.bind(null, club.id, c.id)}>
                      <button type="submit" className="btn btn-outline btn-sm">
                        <Trash2 size={11} />
                      </button>
                    </form>
                  </div>
                ))}
              </div>

              <details className="mt-2">
                <summary className="cursor-pointer text-xs flex items-center gap-1.5" style={{ color: "var(--gold)" }}>
                  <Plus size={12} />
                  הוסף איש קשר ל׳בומצה
                </summary>
                <form action={addClubTeamContact.bind(null, club.id, t.id)} className="grid grid-cols-2 gap-2 mt-2">
                  <input name="name" placeholder="שם *" required className="input" />
                  <input name="role" placeholder="תפקיד (מאמן/מנהל נוער...)" className="input" />
                  <input name="phone" placeholder="טלפון" className="input" />
                  <input name="email" placeholder="אימייל" className="input" />
                  <div className="col-span-2">
                    <button type="submit" className="btn btn-gold btn-sm">
                      הוסף
                    </button>
                  </div>
                </form>
              </details>
            </div>
          ))}
          {teams.length === 0 && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              אין עדיין תתי-קבוצות
            </p>
          )}
        </div>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm flex items-center gap-1.5" style={{ color: "var(--gold)" }}>
            <Plus size={14} />
            הוסף תת-קבוצה
          </summary>
          <form action={addClubTeam.bind(null, club.id)} className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="field-label">שם הקבוצה * (למשל: נערים א')</label>
              <input name="name" required className="input" />
            </div>
            <div>
              <label className="field-label">הערות</label>
              <input name="notes" className="input" />
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
            בקשה חדשה למועדונים הזה
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
        → חזאר לנישואת המועדון
      </Link>
    </div>
  );
}
