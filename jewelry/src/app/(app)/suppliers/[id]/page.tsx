import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupplier, listWorkOrders } from "@/lib/data";
import { deleteSupplierAction, updateSupplierAction } from "@/lib/factory-actions";
import SupplierForm from "@/components/SupplierForm";
import { workOrderTone } from "@/lib/constants";
import { date, grams, ils, usd } from "@/lib/format";
import { Badge, Cell, Empty, PageHead, SectionHead } from "@/components/ui";

export default async function SupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  const workOrders = await listWorkOrders({ supplierId: id });
  const open = workOrders.filter((w) => w.isOpen);
  const totalWaste = workOrders.reduce((a, w) => a + w.wasteG, 0);
  const wa = supplier.whatsapp || supplier.phone;

  return (
    <>
      <PageHead title={supplier.name} sub={supplier.type}>
        {wa ? (
          <a
            href={`https://wa.me/${wa.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm"
          >
            וואטסאפ
          </a>
        ) : null}
      </PageHead>

      <div className="cell-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <Cell label="איש קשר" value={supplier.contactName ?? "—"} />
        <Cell label="טלפון" value={supplier.phone ?? "—"} dir="ltr" />
        <Cell label="זמן אספקה" value={supplier.leadDays ? `${supplier.leadDays} ימים` : "—"} />
        <Cell label="תנאי תשלום" value={supplier.paymentTerms ?? "—"} />
        <Cell label="עבודות פתוחות" value={<span className={`num ${open.length ? "warn" : ""}`}>{open.length}</span>} />
        <Cell label="פחת מצטבר" value={<span className="num">{grams(totalWaste)}</span>} />
      </div>

      <section>
        <SectionHead title="הזמנות עבודה" latin="WORK ORDERS" />
        {workOrders.length === 0 ? (
          <Empty>
            <p>עוד לא נשלחה עבודה לספק הזה.</p>
          </Empty>
        ) : (
          <div className="panel panel-tight table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>מס׳</th>
                  <th>הזמנה</th>
                  <th>עבודה</th>
                  <th>סטטוס</th>
                  <th>ימים בחוץ</th>
                  <th>עלות</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((w) => (
                  <tr key={w.id} className="link-row">
                    <td className="num">{w.woNumber}</td>
                    <td className="num">
                      <Link href={`/orders/${w.orderId}?tab=factory`}>{w.orderNumber}</Link>
                    </td>
                    <td className="muted">{w.scope}</td>
                    <td>
                      <Badge tone={workOrderTone(w.status)}>{w.status}</Badge>
                    </td>
                    <td className={`num ${(w.daysOut ?? 0) > 10 ? "warn" : "muted"}`}>
                      {w.daysOut === null ? "—" : `${w.daysOut}`}
                    </td>
                    <td className="num">
                      {w.cost ? (w.costCurrency === "USD" ? usd(w.cost) : ils(w.cost)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <SectionHead title="עריכה" latin="EDIT" />
        <SupplierForm
          supplier={supplier}
          action={updateSupplierAction}
          submitLabel="שמור שינויים"
        />
      </section>

      <hr className="hairline" />
      <form action={deleteSupplierAction} className="row">
        <input type="hidden" name="id" value={supplier.id} />
        <button className="btn btn-ghost btn-sm btn-danger" type="submit">
          מחיקת הספק
        </button>
        <span className="quiet" style={{ fontSize: 12 }}>
          אפשרי רק כשאין לו הזמנות עבודה. נפתחו ב-{date(supplier.createdAt)}.
        </span>
      </form>
    </>
  );
}

export const dynamic = "force-dynamic";
