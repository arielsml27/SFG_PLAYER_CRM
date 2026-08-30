"use client";

import { useActionState } from "react";
import { refreshRatesAction, type RatesResult } from "@/lib/actions";

/**
 * משיכת שערים בלחיצה. המשיכה רצה גם לבד בעליית המערכת, אבל שער זהב זז
 * במהלך היום — וכשפותחים הזמנה חדשה כדאי שיהיה המספר של עכשיו.
 */
export default function RefreshRates({
  fetchedAt,
  source,
}: {
  fetchedAt: string | null;
  source: string | null;
}) {
  const [result, formAction, pending] = useActionState<RatesResult, FormData>(
    refreshRatesAction,
    null
  );

  return (
    <form action={formAction} className="stack-sm">
      <div className="row">
        <button className="btn btn-sm" type="submit" disabled={pending}>
          {pending ? "מושך…" : "משוך שערים עכשיו"}
        </button>
        <span className="quiet" style={{ fontSize: 12.5 }}>
          {fetchedAt
            ? `נמשכו אוטומטית ${new Date(fetchedAt).toLocaleString("he-IL")}${
                source ? ` · ${source}` : ""
              }`
            : "השערים הוזנו ידנית — עוד לא נמשכו ממקור חיצוני."}
        </span>
      </div>

      {result ? (
        <p className={result.ok ? "good" : "danger"} style={{ fontSize: 13 }}>
          {result.message}
        </p>
      ) : null}
    </form>
  );
}
