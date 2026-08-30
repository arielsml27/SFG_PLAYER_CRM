import { getSettings, listExpenses, listSuppliers } from "@/lib/data";
import { createExpenseAction, deleteExpenseAction } from "@/lib/actions";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { date, ils, todayIso, usd } from "@/lib/format";
import { Badge, Cell, Empty, Field, PageHead, SectionHead } from "@/components/ui";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; category?: string }>;
}) {
  const { month, category } = await searchParams;
  const [expenses, suppliers, settings] = await Promise.all([
    listExpenses({ month, category }),
    listSuppliers(),
    getSettings(),
  ]);

  const totalUsd = expenses.reduce((a, e) => a + e.amountUsd, 0);
  const recurring = expenses.filter((e) => e.isRecurring).length;
  const thisMonth = todayIso().slice(0, 7);

  return (
    <>
      <PageHead
        title="הוצאות"
        sub={month ? `חודש ${month}` : "כל התקופה"}
      >
        <form className="row" style={{ gap: 6 }}>
          <input type="month" name="month" defaultValue={month ?? ""} style={{ width: 150 }} />
          <select name="category" defaultValue={category ?? "הכל"} style={{ width: 150 }}>
            <option>הכל</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button className="btn btn-sm" type="submit">
            סינון
          </button>
        </form>
      </PageHead>

      <div className="cell-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <Cell label="סה״כ בתצוגה" value={<span className="num">{ils(totalUsd * settings.fxUsdIls)}</span>} />
        <Cell label="רשומות" value={<span className="num">{expenses.length}</span>} />
        <Cell label="הוצאות קבועות" value={<span className="num">{recurring}</span>} />
      </div>

      <section>
        <SectionHead title="הוצאה חדשה" latin="NEW" />
        <form action={createExpenseAction} className="panel stack">
          <div className="form-grid">
            <Field label="תיאור">
              <input name="description" required placeholder="שכירות סטודיו — ספטמבר" />
            </Field>
            <Field label="קטגוריה">
              <select name="category" defaultValue="אחר">
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="סכום">
              <input type="number" name="amount" step="0.01" min="0" required />
            </Field>
            <Field label="מטבע">
              <select name="currency" defaultValue="ILS">
                <option value="ILS">₪</option>
                <option value="USD">$</option>
              </select>
            </Field>
            <Field label="תאריך">
              <input type="date" name="spentAt" defaultValue={todayIso()} />
            </Field>
            <Field label="ספק">
              <select name="supplierId" defaultValue="">
                <option value="">—</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="מס׳ חשבונית">
              <input name="invoiceNumber" dir="ltr" />
            </Field>
          </div>
          <label className="switch">
            <input type="checkbox" name="isRecurring" />
            הוצאה קבועה שחוזרת כל חודש
          </label>
          <div>
            <button className="btn btn-primary" type="submit">
              רשום הוצאה
            </button>
          </div>
        </form>
      </section>

      <section>
        <SectionHead title="הרשימה" latin="EXPENSES" />
        {expenses.length === 0 ? (
          <Empty>
            <p>{month || category ? "אין הוצאות שמתאימות לסינון." : "עוד לא נרשמו הוצאות."}</p>
            <p className="quiet" style={{ fontSize: 13, maxWidth: 440 }}>
              שכירות, פרסום, אריזה, רואה חשבון. בלי אלה דוח הרווחיות מראה רווח
              גולמי בלבד — לא כמה באמת נשאר.
            </p>
          </Empty>
        ) : (
          <div className="panel panel-tight table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>תיאור</th>
                  <th>קטגוריה</th>
                  <th>ספק</th>
                  <th>סכום</th>
                  <th>חשבונית</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="num muted">{date(e.spentAt)}</td>
                    <td>
                      {e.description}
                      {e.isRecurring ? (
                        <span className="badge badge-quiet" style={{ marginInlineStart: 8 }}>
                          קבועה
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <Badge tone="accent">{e.category}</Badge>
                    </td>
                    <td className="muted">{e.supplierName ?? "—"}</td>
                    <td className="num">
                      {e.currency === "USD" ? usd(e.amount) : ils(e.amount)}
                    </td>
                    <td className="num muted">{e.invoiceNumber ?? "—"}</td>
                    <td style={{ width: 60 }}>
                      <form action={deleteExpenseAction}>
                        <input type="hidden" name="id" value={e.id} />
                        <button className="btn btn-sm btn-ghost btn-danger" type="submit">
                          מחק
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="quiet" style={{ fontSize: 12.5 }}>
        עלויות של פריט מסוים — זהב, אבנים, עבודת מפעל — נספרות בתמחור ההזמנה
        ולא כאן. כאן נרשם מה שלא שייך לפריט אחד. החודש הנוכחי הוא {thisMonth}.
      </p>
    </>
  );
}

export const dynamic = "force-dynamic";
