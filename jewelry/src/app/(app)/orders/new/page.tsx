import Link from "next/link";
import { listCustomers, getSettings } from "@/lib/data";
import { createOrderAction } from "@/lib/actions";
import { ORDER_CHANNELS, ORDER_TYPES, PRIORITIES } from "@/lib/constants";
import { todayIso } from "@/lib/format";
import { Empty, Field, PageHead, SectionHead } from "@/components/ui";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const [customers, settings] = await Promise.all([listCustomers(), getSettings()]);
  const preselected = customers.find((c) => c.id === customerId);

  if (customers.length === 0) {
    return (
      <>
        <PageHead title="הזמנה חדשה" />
        <Empty>
          <p>צריך לקוח לפני שפותחים הזמנה.</p>
          <Link href="/customers/new" className="btn btn-primary btn-sm">
            הוסף לקוח
          </Link>
        </Empty>
      </>
    );
  }

  return (
    <>
      <PageHead title="הזמנה חדשה" sub="השערים של היום יישמרו על ההזמנה ולא ישתנו מעצמם" />
      <form action={createOrderAction} className="stack">
        <div className="panel stack">
          <SectionHead title="פרטי ההזמנה" latin="ORDER" />
          <div className="form-grid">
            <Field label="לקוח">
              <select name="customerId" defaultValue={customerId ?? ""} required>
                <option value="" disabled>
                  בחר לקוח
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="סוג">
              <select name="type" defaultValue="בהזמנה">
                {ORDER_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="ערוץ">
              <select name="channel" defaultValue="וואטסאפ">
                {ORDER_CHANNELS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="דחיפות">
              <select name="priority" defaultValue="רגיל">
                {PRIORITIES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>
          <label className="switch">
            <input type="checkbox" name="isExport" defaultChecked={preselected?.defaultExport ?? false} />
            עסקת ייצוא — מע״מ 0%
          </label>
        </div>

        <div className="panel stack">
          <SectionHead title="תאריכים" latin="DATES" />
          <div className="form-grid">
            <Field label="תאריך האירוע" hint="חתונה, הצעה, יום נישואין">
              <input type="date" name="eventDate" defaultValue={todayIso()} />
            </Field>
            <Field label="תאריך מובטח ללקוח">
              <input type="date" name="promisedDate" defaultValue={todayIso()} />
            </Field>
            <Field label="יעד פנימי" hint="מוקדם מהמובטח">
              <input type="date" name="internalDueDate" defaultValue={todayIso()} />
            </Field>
            <Field label="מקדמה (%)">
              <input type="number" name="depositPct" defaultValue={settings.defaultDepositPct} step="1" min="0" max="100" />
            </Field>
          </div>
        </div>

        <div className="panel stack">
          <SectionHead title="הערות" latin="NOTES" />
          <Field label="הערות">
            <textarea name="notes" placeholder="מה הלקוח ביקש, על מה סוכם…" />
          </Field>
        </div>

        <div className="row">
          <button type="submit" className="btn btn-primary">
            פתח הזמנה
          </button>
          <Link href="/orders" className="btn btn-ghost">
            ביטול
          </Link>
        </div>
      </form>
    </>
  );
}
