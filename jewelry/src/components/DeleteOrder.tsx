"use client";

import { deleteOrderAction } from "@/lib/actions";

/**
 * יושב בתחתית עמוד ההזמנה בכל לשונית, ולא רק ב״פרטים״ — מי שרוצה למחוק
 * הזמנה לא אמור לנחש באיזו לשונית הכפתור מתחבא.
 */
export default function DeleteOrder({
  id,
  orderNumber,
  itemCount,
  paymentCount,
}: {
  id: string;
  orderNumber: string;
  itemCount: number;
  paymentCount: number;
}) {
  const parts = [
    itemCount ? `${itemCount} פריטים` : null,
    paymentCount ? `${paymentCount} תשלומים` : null,
  ].filter(Boolean);

  return (
    <form
      action={deleteOrderAction}
      onSubmit={(e) => {
        const tail = parts.length ? `\n\nיימחקו איתה: ${parts.join(", ")}.` : "";
        if (!window.confirm(`למחוק את הזמנה ${orderNumber}?${tail}\n\nהפעולה לא ניתנת לביטול.`))
          e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <div className="row">
        <button className="btn btn-ghost btn-sm btn-danger" type="submit">
          מחיקת ההזמנה
        </button>
        <span className="quiet" style={{ fontSize: 12 }}>
          {parts.length
            ? `${parts.join(" ו-")} יימחקו יחד איתה.`
            : "המחיקה סופית ולא ניתנת לביטול."}
        </span>
      </div>
    </form>
  );
}
