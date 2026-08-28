import Link from "next/link";
import { listCustomers } from "@/lib/data";
import { createCollectionAction } from "@/lib/product-actions";
import { Field, PageHead, SectionHead } from "@/components/ui";

export default async function NewCollectionPage() {
  const customers = await listCustomers();

  return (
    <>
      <PageHead title="קולקציה חדשה" sub="אחרי השמירה בוחרים אילו דגמים ייכנסו" />
      <form action={createCollectionAction} className="stack">
        <div className="panel stack">
          <SectionHead title="הקולקציה" latin="COLLECTION" />
          <div className="form-grid">
            <Field label="שם" hint="מה שהלקוח יראה בראש העמוד">
              <input name="title" required autoFocus placeholder="מבחר טבעות אירוסין" />
            </Field>
            <Field label="כותרת משנה">
              <input name="subtitle" placeholder="נבחר במיוחד עבורך" />
            </Field>
            <Field label="ללקוח" hint="לא חובה — רק לסימון פנימי">
              <select name="customerId" defaultValue="">
                <option value="">—</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="מחירים">
              <select name="priceMode" defaultValue="מחיר">
                <option>מחיר</option>
                <option>סיטונאי</option>
                <option>לפנייה</option>
              </select>
            </Field>
          </div>
          <Field label="פתיח" hint="כמה מילים שמופיעות מעל המבחר">
            <textarea name="intro" />
          </Field>
        </div>
        <div className="row">
          <button className="btn btn-primary" type="submit">
            צור קולקציה
          </button>
          <Link href="/collections" className="btn btn-ghost">
            ביטול
          </Link>
        </div>
      </form>
    </>
  );
}
