import Link from "next/link";
import { getAllTasks } from "@/lib/data";
import { formatDate } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import { updateTaskStatus, deleteTask, addTask } from "@/lib/actions";
import { TASK_STATUSES, TASK_STATUS_LABELS, TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/lib/constants";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const tasks = await getAllTasks({ status: sp.status });

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">משימות</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          כל המשימות הפתוחות והסגורות בסוכנות
        </p>
      </div>

      <div className="flex gap-2">
        <Link href="/tasks" className={`btn btn-sm ${!sp.status ? "btn-primary" : "btn-outline"}`}>
          הכל
        </Link>
        {TASK_STATUSES.map((s) => (
          <Link key={s} href={`/tasks?status=${s}`} className={`btn btn-sm ${sp.status === s ? "btn-primary" : "btn-outline"}`}>
            {TASK_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <details className="card p-4">
        <summary className="cursor-pointer font-semibold text-sm" style={{ color: "var(--navy)" }}>
          + משימה כללית חדשה (לא קשורה לשחקן ספציפי)
        </summary>
        <form action={addTask} className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="field-label">כותרת</label>
            <input name="title" required className="input" />
          </div>
          <div>
            <label className="field-label">אחראי</label>
            <input name="owner" className="input" />
          </div>
          <div>
            <label className="field-label">תאריך יעד</label>
            <input type="date" name="dueDate" className="input" />
          </div>
          <div>
            <label className="field-label">עדיפות</label>
            <select name="priority" defaultValue="NORMAL" className="input">
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="field-label">תיאור</label>
            <textarea name="description" className="input" rows={2} />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="btn btn-gold btn-sm">
              הוסף משימה
            </button>
          </div>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>כותרת</th>
              <th>שחקן</th>
              <th>אחראי</th>
              <th>תאריך יעד</th>
              <th>עדיפות</th>
              <th>סטטוס</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td className="font-medium">{t.title}</td>
                <td>
                  {t.player ? (
                    <Link href={`/players/${t.playerId}`} className="hover:underline">
                      {t.player.firstName} {t.player.lastName}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{t.owner ?? "—"}</td>
                <td>{formatDate(t.dueDate)}</td>
                <td>
                  <StatusBadge kind="taskPriority" value={t.priority} />
                </td>
                <td>
                  <form
                    action={async (fd: FormData) => {
                      "use server";
                      await updateTaskStatus(t.id, String(fd.get("status")), t.playerId);
                    }}
                  >
                    <AutoSubmitSelect
                      name="status"
                      defaultValue={t.status}
                      options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
                    />
                  </form>
                </td>
                <td>
                  <form action={deleteTask.bind(null, t.id, t.playerId)}>
                    <ConfirmSubmitButton confirmMessage="למחוק את המשימה?">
                      <Trash2 size={13} />
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8" style={{ color: "var(--muted)" }}>
                  אין משימות
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
