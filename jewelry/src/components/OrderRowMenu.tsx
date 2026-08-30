"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toggleCustomerLinkAction, toggleQuoteAction } from "@/lib/customer-actions";
import { deleteOrderAction } from "@/lib/actions";

/**
 * הפעולות שעושים על הזמנה בלי להיכנס אליה. הצעת מחיר, עמוד לקוח ומחיקה
 * חיו עד עכשיו בתוך לשונית בתוך ההזמנה — שלוש קליקים כדי לשלוח מחיר.
 *
 * נסגר בלחיצה בחוץ וב-Escape, כי תפריט שנשאר פתוח מסתיר את השורה הבאה.
 *
 * התפריט מרונדר ל-body ולא בתוך השורה: הטבלה יושבת ב-overflow-x כדי
 * לגלול לרוחב בטלפון, וכל דבר שנפתח מתוכה נחתך בגבול הגלילה.
 */
export default function OrderRowMenu({
  orderId,
  orderNumber,
  accessToken,
  quoteEnabled,
  customerLinkEnabled,
  itemCount,
  quoteUrl,
  customerUrl,
}: {
  orderId: string;
  orderNumber: string;
  accessToken: string | null;
  quoteEnabled: boolean;
  customerLinkEnabled: boolean;
  itemCount: number;
  quoteUrl: string | null;
  customerUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<{ left: number; top?: number; bottom?: number } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const POP_WIDTH = 232;
  const POP_MIN_HEIGHT = 260;

  function place(el: HTMLElement) {
    const r = el.getBoundingClientRect();
    const left = Math.min(Math.max(8, r.left), window.innerWidth - POP_WIDTH - 8);
    // בשורה בתחתית המסך אין מקום מתחת לכפתור. במקום לגלוש מחוץ למסך
    // התפריט נפתח כלפי מעלה, אל הצד שבו יש יותר מקום.
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    setAt(
      below < POP_MIN_HEIGHT && above > below
        ? { left, bottom: window.innerHeight - r.top + 6 }
        : { left, top: r.bottom + 6 }
    );
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!box.current?.contains(t) && !pop.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // התפריט ממוקם מול מקום קבוע במסך, ולכן גלילה מנתקת אותו מהכפתור.
    // מזיזים אותו ולא סוגרים: הלחיצה עצמה גוררת גלילה של הטבלה לרוחב
    // כשהכפתור לא נראה, וסגירה הייתה מבטלת את הפתיחה באותו רגע.
    const onMove = () => {
      if (trigger.current) place(trigger.current);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  async function copy(url: string, label: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(label);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied("לא הצלחתי להעתיק");
    }
  }

  return (
    <div className="row-menu" ref={box}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        ref={trigger}
        onClick={(e) => {
          place(e.currentTarget);
          setOpen((v) => !v);
        }}
      >
        פעולות ▾
      </button>

      {open && at
        ? createPortal(
            <div
              className="row-menu-pop"
              role="menu"
              ref={pop}
              style={{ top: at.top, bottom: at.bottom, left: at.left, width: POP_WIDTH }}
            >
          <span className="micro">הצעת מחיר</span>
          {itemCount === 0 ? (
            <p className="quiet">
              אין פריטים בהזמנה — אין ממה להרכיב הצעה.{" "}
              <Link href={`/orders/${orderId}/items/new`} className="gold">
                הוסף פריט
              </Link>
            </p>
          ) : (
            <>
              <form action={toggleQuoteAction}>
                <input type="hidden" name="id" value={orderId} />
                <button type="submit" className={quoteEnabled ? undefined : "primary"}>
                  {quoteEnabled ? "בטל פרסום הצעה" : "פרסם הצעת מחיר"}
                </button>
              </form>
              {quoteEnabled && accessToken ? (
                <>
                  <a href={`/quote/${accessToken}`} target="_blank" rel="noreferrer">
                    פתח את ההצעה
                  </a>
                  {quoteUrl ? (
                    <button type="button" onClick={() => copy(quoteUrl, "לינק ההצעה הועתק")}>
                      העתק לינק להצעה
                    </button>
                  ) : null}
                </>
              ) : null}
            </>
          )}

          <div className="sep" />
          <span className="micro">עמוד לקוח</span>
          <form action={toggleCustomerLinkAction}>
            <input type="hidden" name="id" value={orderId} />
            <button type="submit">{customerLinkEnabled ? "כבה קישור" : "הפעל קישור ללקוח"}</button>
          </form>
          {customerLinkEnabled && accessToken ? (
            <>
              <a href={`/order/${accessToken}`} target="_blank" rel="noreferrer">
                פתח את עמוד הלקוח
              </a>
              {customerUrl ? (
                <button type="button" onClick={() => copy(customerUrl, "לינק העמוד הועתק")}>
                  העתק לינק לעמוד
                </button>
              ) : null}
            </>
          ) : null}

          <div className="sep" />
          <Link href={`/orders/${orderId}`}>פתח את ההזמנה</Link>
          <Link href={`/orders/${orderId}/items/new`}>הוסף פריט</Link>

          <div className="sep" />
          <form
            action={deleteOrderAction}
            onSubmit={(e) => {
              if (!window.confirm(`למחוק את הזמנה ${orderNumber}?\n\nהפעולה לא ניתנת לביטול.`))
                e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={orderId} />
            <button type="submit" className="danger">
              מחיקת ההזמנה
            </button>
          </form>

              {copied ? <span className="good copied">{copied}</span> : null}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
