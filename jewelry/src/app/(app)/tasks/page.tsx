import Link from "next/link";
import { listTasks } from "@/lib/data";
import { createTaskAction, deleteTaskAction, toggleTaskAction } from "@/lib/actions";
import { PRIORITIES } from "@/lib/constants";
import { relativeDays } from "@/lib/format";
import { Badge, Empty, Field, PageHead, SectionHead } from "@/components/ui";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const { all } = await searchParams;
  const showAll = all === "1";
  const tasks = await listTasks(showAll);

  return (
    <>
      <PageHead title="משימות" sub={`${tasks.filter((t) => t.status === "פתוח").length} פתוחות`}>
        <Link href={showAll ? "/tasks" : "/tasks?all=1"} className="btn btn-sm">
          {showAll ? "הצג רק פתוחות" : "הצג גם שהושלמו"}
        </Link>
      </PageHead>

      <section>
        <SectionHead title="משימה חדשה" latin="NEW" />
        <form action={createTaskAction} className="panel row" style={{ alignItems: "flex-end" }}>
          <div style={{ flex: "3 1 240px" }}>
            <Field label="מה צריך לעשות">
              <input name="title" required placeholder="למשל: להזמין אבן מרכזית" />
            </Field>
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <Field label="עד מתי">
              <input type="date" name="dueDate" />
            </Field>
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <Field label="דחיפות">
              <select name="priority" defaultValue="רגיל">
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
          </div>
          <button className="btn btn-primary" type="submit">
            הוסף
          </button>
        </form>
      </section>

      <section>
        <SectionHead title="הרשימה" latin="TASKS" />
        {tasks.length === 0 ? (
          <Empty>
            <p>אין משימות פתוחות. </p>
          </Empty>
        ) : (
          <div className="panel panel-tight table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th></th>
                  <th>משימה</th>
                  <th>קשור ל</th>
                  <th>דחיפות</th>
                  <th>עד מתי</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const rel = t.dueDate ? relativeDays(t.dueDate) : "—";
                  const late = rel.startsWith("עבר");
                  const done = t.status === "הושלם";
                  return (
                    <tr key={t.id}>
                      <td style={{ width: 44 }}>
                        <form action={toggleTaskAction}>
                          <input type="hidden" name="id" value={t.id} />
                          <button type="submit" className="btn btn-sm btn-ghost" style={{ padding: "2px 9px" }}>
                            {done ? "✓" : "○"}
                          </button>
                        </form>
                      </td>
                      <td
                        style={{
                          textDecoration: done ? "line-through" : undefined,
                          color: done ? "var(--ink-3)" : undefined,
                        }}
                      >
                        {t.title}
                      </td>
                      <td className="muted">
                        {t.orderNumber ? (
                          <Link href={`/orders/${t.orderId}`} className="gold">
                            {t.orderNumber}
                          </Link>
                        ) : t.customerName ? (
                          <Link href={`/customers/${t.customerId}`} className="gold">
                            {t.customerName}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <Badge tone={t.priority === "רגיל" ? "quiet" : "warn"}>{t.priority}</Badge>
                      </td>
                      <td className={`num ${late && !done ? "danger" : "muted"}`}>{rel}</td>
                      <td style={{ width: 60 }}>
                        <form action={deleteTaskAction}>
                          <input type="hidden" name="id" value={t.id} />
                          <button type="submit" className="btn btn-sm btn-ghost btn-danger">
                            מחק
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
