"use client";

import { useActionState, useState } from "react";
import { approveDesignAction } from "@/lib/customer-actions";
import type { ApprovalResult } from "@/lib/customer-types";
import { Field } from "@/components/ui";

/** כפתור אישור העיצוב בעמוד הלקוח. אימות בטוקן שבכתובת. */
export default function DesignApproval({ token }: { token: string }) {
  const [result, formAction, sending] = useActionState<ApprovalResult, FormData>(
    approveDesignAction,
    null
  );
  const [open, setOpen] = useState(false);

  if (result?.ok) {
    return (
      <div className="panel panel-accent" style={{ textAlign: "center" }}>
        <div className="micro">אישור העיצוב</div>
        <p className="good" style={{ fontSize: 15, marginTop: 6 }}>
          {result.message}
        </p>
      </div>
    );
  }

  return (
    <div className="panel panel-accent stack">
      <div style={{ textAlign: "center" }}>
        <div className="micro">אישור העיצוב</div>
        <p style={{ fontSize: 14.5, marginTop: 6, lineHeight: 1.7 }}>
          אחרי האישור מתחילים בייצור, ולא ניתן לשנות את העיצוב.
        </p>
      </div>

      <form action={formAction} className="stack-sm">
        <input type="hidden" name="token" value={token} />
        {open ? (
          <Field label="הערה (לא חובה)">
            <input name="note" placeholder="למשל: אפשר קצת יותר עדין" />
          </Field>
        ) : null}
        {result && !result.ok ? (
          <p className="danger" style={{ fontSize: 13 }}>
            {result.message}
          </p>
        ) : null}
        <div
          style={{ display: "flex", gap: "var(--space-2)", justifyContent: "center", flexWrap: "wrap" }}
        >
          <button className="cta" type="submit" disabled={sending}>
            {sending ? "רגע…" : "אני מאשר את העיצוב"}
          </button>
          {!open ? (
            <button className="btn" type="button" onClick={() => setOpen(true)}>
              הוספת הערה
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
