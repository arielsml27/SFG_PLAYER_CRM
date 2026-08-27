import { getMeetings, getAllCrmUsers } from "@/lib/data";
import { createMeeting, deleteMeeting } from "@/lib/meeting-actions";
import { formatDate } from "@/lib/format";
import { MEETING_TYPES, MEETING_TYPE_LABELS } from "@/lib/constants";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const [meetingList, users] = await Promise.all([getMeetings(), getAllCrmUsers()]);

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">פגישות</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          כל הפגישות המתוכננות והשמורות בסוכנות
        </p>
      </div>

      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-sm" style={{ color: "var(--navy)" }}>
          + פגישה חדשה
        </summary>
        <form action={createMeeting} className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="field-label">עם מי הפגישה</label>
            <input name="withWhom" required className="input" />
          </div>
          <div>
            <label className="field-label">באיזה הקשר</label>
            <input name="context" className="input" />
          </div>
          <div>
            <label className="field-label">מי אחראי</label>
            <select name="responsibleUserId" defaultValue="" className="input">
              <option value="">בחר</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">סוג פגישה</label>
            <select name="meetingType" defaultValue="IN_PERSON" className="input">
              {MEETING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {MEETING_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">תאריך</label>
            <input type="date" name="meetingDate" className="input" />
          </div>
          <div>
            <label className="field-label">שעה</label>
            <input type="time" name="meetingTime" className="input" />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="btn btn-gold btn-sm">
              הוסף פגישה
            </button>
          </div>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>עם מי הפגישה</th>
              <th>הקשר</th>
              <th>אחראי</th>
              <th>סוג פגישה</th>
              <th>תאריך</th>
              <th>שעה</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {meetingList.map((m) => (
              <tr key={m.id}>
                <td className="font-medium">{m.withWhom}</td>
                <td>{m.context ?? "—"}</td>
                <td>{m.responsible ? m.responsible.name || m.responsible.email : "—"}</td>
                <td>{MEETING_TYPE_LABELS[m.meetingType] ?? m.meetingType}</td>
                <td>{m.meetingDate ? formatDate(m.meetingDate) : "—"}</td>
                <td>{m.meetingTime ?? "—"}</td>
                <td>
                  <form action={deleteMeeting.bind(null, m.id)}>
                    <ConfirmSubmitButton confirmMessage="למחוק את הפגישה?">
                      <Trash2 size={13} />
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {meetingList.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8" style={{ color: "var(--muted)" }}>
                  אין פגישות
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
