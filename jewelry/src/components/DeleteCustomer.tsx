"use client";

import { useActionState, useState } from "react";
import { deleteCustomerAction } from "@/lib/actions";

/**
 * מחיקה היא הפעולה היחידה במערכת שאי אפשר לבטל. לקוח בלי הזמנות נמחק
 * באישור אחד; לקוח עם הזמנות דורש סימון מפורש, כי ההזמנות — והתשלומים
 * והתמונות שלהן — יורדות איתו.
 */
export default function DeleteCustomer({
  id,
  name,
  orderCount,
}: {
  id: string;
  name: string;
  orderCount: number;
}) {
  const [error, formAction, pending] = useActionState(deleteCustomerAction, null);
  const [withOrders, setWithOrders] = useState(false);
  const hasOrders = orderCount > 0;
  const ready = !hasOrders || withOrders;

  return (
    <form
      action={formAction}
      className="stack-sm"
      onSubmit={(e) => {
        const what = hasOrders
          ? `${name} ו-${orderCount} ההזמנות שלו, על הפריטים והתשלומים שבהן`
          : name;
        if (!window.confirm(`למחוק את ${what}?\n\nהפעולה לא ניתנת לביטול.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />

      {hasOrders ? (
        <label className="switch">
          <input
            type="checkbox"
            name="withOrders"
            checked={withOrders}
            onChange={(e) => setWithOrders(e.target.checked)}
          />
          כן, למחוק גם את {orderCount} ההזמנות של הלקוח
        </label>
      ) : null}

      <div className="row">
        <button
          type="submit"
          className="btn btn-ghost btn-sm btn-danger"
          disabled={!ready || pending}
        >
          {pending ? "מוחק…" : hasOrders ? `מחיקת הלקוח ו-${orderCount} הזמנות` : "מחיקת לקוח"}
        </button>
        <span className="quiet" style={{ fontSize: 12 }}>
          {hasOrders
            ? "ההזמנות, הפריטים, התשלומים והתמונות יימחקו יחד איתו."
            : "המחיקה סופית — היומן והמשימות של הלקוח יימחקו איתו."}
        </span>
      </div>

      {error ? (
        <p className="danger" style={{ fontSize: 13 }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
