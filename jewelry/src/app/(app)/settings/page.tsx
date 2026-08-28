import { db, schema } from "@/db";
import { desc } from "drizzle-orm";
import { getSettings } from "@/lib/data";
import { saveSettingsAction } from "@/lib/actions";
import {
  KARATS,
  MULTIPLIER_TIERS,
  goldPerGramUsd,
  marginPctFromMultiplier,
} from "@/lib/pricing";
import { dateTime, ils, pct, usd } from "@/lib/format";
import { Field, PageHead, SectionHead } from "@/components/ui";

export default async function SettingsPage() {
  const settings = await getSettings();
  const history = await db
    .select()
    .from(schema.rateHistory)
    .orderBy(desc(schema.rateHistory.createdAt))
    .limit(10);

  return (
    <>
      <PageHead title="הגדרות ושערים" sub={`עודכן לאחרונה ${dateTime(settings.updatedAt)}`} />

      <section>
        <SectionHead title="שערי היום" latin="RATES" />
        <form action={saveSettingsAction} className="panel stack">
          <div className="form-grid">
            <Field label="זהב 24K לאונקיית טרוי ($)" hint="מקור: Kitco">
              <input
                type="number"
                name="goldSpotUsdOz"
                step="0.01"
                min="0"
                defaultValue={settings.goldSpotUsdOz}
              />
            </Field>
            <Field label="שער יציג $/₪" hint="מקור: בנק ישראל">
              <input type="number" name="fxUsdIls" step="0.0001" min="0" defaultValue={settings.fxUsdIls} />
            </Field>
            <Field label="מע״מ (%)" hint="בעסקת ייצוא מתאפס אוטומטית">
              <input type="number" name="vatPct" step="0.5" min="0" max="100" defaultValue={settings.vatPct} />
            </Field>
            <Field label="מכפיל ברירת מחדל">
              <select name="defaultMultiplier" defaultValue={String(settings.defaultMultiplier)}>
                {MULTIPLIER_TIERS.map((m) => (
                  <option key={m} value={m}>
                    ×{m} — רווח {pct(marginPctFromMultiplier(m), 0)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="מקדמה ברירת מחדל (%)">
              <input
                type="number"
                name="defaultDepositPct"
                step="1"
                min="0"
                max="100"
                defaultValue={settings.defaultDepositPct}
              />
            </Field>
            <Field label="שם העסק">
              <input name="businessName" defaultValue={settings.businessName} />
            </Field>
          </div>
          <p className="quiet" style={{ fontSize: 12.5 }}>
            עדכון השערים לא משנה הזמנות קיימות — כל הזמנה שומרת את השערים שלה. אפשר לרענן אותם ידנית
            בעמוד ההזמנה.
          </p>
          <div>
            <button className="btn btn-primary" type="submit">
              שמור שערים
            </button>
          </div>
        </form>
      </section>

      <section>
        <SectionHead title="עמודי שיתוף" latin="SHARING" />
        <form action={saveSettingsAction} className="panel stack">
          <input type="hidden" name="goldSpotUsdOz" value={settings.goldSpotUsdOz} />
          <input type="hidden" name="fxUsdIls" value={settings.fxUsdIls} />
          <input type="hidden" name="vatPct" value={settings.vatPct} />
          <input type="hidden" name="defaultMultiplier" value={settings.defaultMultiplier} />
          <input type="hidden" name="defaultDepositPct" value={settings.defaultDepositPct} />
          <input type="hidden" name="businessName" value={settings.businessName} />
          <div className="form-grid">
            <Field label="וואטסאפ לפניות" hint="הכפתור בעמודי השיתוף מוביל לכאן">
              <input name="whatsappNumber" defaultValue={settings.whatsappNumber ?? ""} dir="ltr" placeholder="+972…" />
            </Field>
            <Field label="אינסטגרם">
              <input name="instagramHandle" defaultValue={settings.instagramHandle ?? ""} dir="ltr" placeholder="@samuel" />
            </Field>
            <Field label="כתובת בסיס ללינקים" hint="הכתובת שממנה המערכת נגישה מבחוץ">
              <input name="publicBaseUrl" defaultValue={settings.publicBaseUrl ?? ""} dir="ltr" placeholder="https://…" />
            </Field>
          </div>
          <p className="quiet" style={{ fontSize: 12.5 }}>
            כל עוד המערכת רצה רק על המחשב שלך, לינק שיתוף יעבוד רק מהמחשב הזה. כדי לשלוח
            אותו ללקוח צריך שהמערכת תהיה נגישה מהאינטרנט.
          </p>
          <div>
            <button className="btn btn-primary" type="submit">
              שמור פרטי שיתוף
            </button>
          </div>
        </form>
      </section>

      <section>
        <SectionHead title="מחיר זהב לגרם" latin="GOLD PER GRAM" />
        <div className="panel panel-tight table-scroll">
          <table className="data" style={{ minWidth: 380 }}>
            <thead>
              <tr>
                <th>קראט</th>
                <th>טוהר</th>
                <th>$ / גרם</th>
                <th>₪ / גרם</th>
              </tr>
            </thead>
            <tbody>
              {KARATS.map((k) => {
                const perGram = goldPerGramUsd(k.fine, settings.goldSpotUsdOz);
                return (
                  <tr key={k.label}>
                    <td className="num">{k.label}</td>
                    <td className="num muted">{k.fine}</td>
                    <td className="num">{usd(perGram)}</td>
                    <td className="num">{ils(perGram * settings.fxUsdIls, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="quiet" style={{ fontSize: 12.5 }}>
          מחיר לגרם = ספוט לאונקיה ÷ 31.1034768 × (טוהר ÷ 999)
        </p>
      </section>

      <section>
        <SectionHead title="מכפיל מול רווח אמיתי" latin="MARKUP VS MARGIN" />
        <div className="panel panel-accent stack">
          <p style={{ fontSize: 13.5 }}>
            מכפיל על העלות אינו שיעור רווח. ×1.3 נותן <strong>23%</strong> רווח ממחיר המכירה, לא 30%.
          </p>
          <div className="table-scroll">
            <table className="data" style={{ minWidth: 320 }}>
              <thead>
                <tr>
                  <th>מכפיל</th>
                  <th>רווח ממחיר המכירה</th>
                </tr>
              </thead>
              <tbody>
                {MULTIPLIER_TIERS.map((m) => (
                  <tr key={m}>
                    <td className="num">×{m}</td>
                    <td className="num gold">{pct(marginPctFromMultiplier(m))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <SectionHead title="היסטוריית שערים" latin="RATE HISTORY" />
        <div className="panel panel-tight table-scroll">
          <table className="data" style={{ minWidth: 400 }}>
            <thead>
              <tr>
                <th>מתי</th>
                <th>זהב / אונקיה</th>
                <th>שער יציג</th>
                <th>מע״מ</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="quiet">
                    עדיין לא נשמרו שערים.
                  </td>
                </tr>
              ) : (
                history.map((r) => (
                  <tr key={r.id}>
                    <td className="num muted">{dateTime(r.createdAt)}</td>
                    <td className="num">{usd(r.goldSpotUsdOz)}</td>
                    <td className="num">{r.fxUsdIls.toFixed(4)}</td>
                    <td className="num">{r.vatPct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
