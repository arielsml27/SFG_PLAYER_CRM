"use client";

import { useActionState } from "react";
import { deleteCustomerAction } from "@/lib/actions";

/**
 * מחיקה היא הפעולה היחידה במערכת שאי אפשר לבטל, ולכן היא מבקשת אישור
 * ומראה את הסיבה במקום ליפול. כשיש הזמנות הכפתור חסום מראש — עדיף
 * להסביר לפני הלחיצה מאשר אחריה.
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
  const blocked = orderCount > 0;

  return (
    <form
      action={formAction}
      className="stack-sm"
      onSubmit={(e) => {
        if (!window.confirm(`למחוק את ${name}? הפעולה לא ניתנת לביטול.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <div className="row">
        <button
          type="submit"
          className="btn btn-ghost btn-sm btn-danger"
          disabled={blocked || pending}
        >
          {pending ? "מוחק…" : "מחיקת לקוח"}
        </button>
        <span className="quiet" style={{ fontSize: 12 }}>
          {blocked
            ? `ללקוח ${orderCount} הזמנות. אפשר למחוק רק לקוח בלי הזמנות.`
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
