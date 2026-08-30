import { db, schema } from "@/db";
import { desc } from "drizzle-orm";
import { getSettings } from "@/lib/data";
import { runBackupAction, saveSettingsAction } from "@/lib/actions";
import { backupDir, isOffMachine, listBackups } from "@/lib/backup";
import {
  KARATS,
  MULTIPLIER_TIERS,
  goldPerGramUsd,
  marginPctFromMultiplier,
} from "@/lib/pricing";
import { dateTime, ils, pct, usd } from "@/lib/format";
import { Badge, Cell, Field, PageHead, SectionHead } from "@/components/ui";
import RefreshRates from "@/components/RefreshRates";

export default async function SettingsPage() {
  const settings = await getSettings();
  const backups = listBackups();
  const backupBytes = backups.reduce((a, b) => a + b.bytes, 0);
  const offMachine = isOffMachine();
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
        <div className="panel stack" style={{ marginBottom: 12 }}>
          <RefreshRates fetchedAt={settings.ratesFetchedAt} source={settings.ratesSource} />
        </div>
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
            <Field label="קראט ברירת מחדל" hint="ממנו מתחיל כל פריט ודגם חדש">
              <select name="defaultKarat" defaultValue={settings.defaultKarat}>
                {KARATS.map((k) => (
                  <option key={k.label} value={k.label}>
                    {k.label} — {k.fine}
                  </option>
                ))}
              </select>
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
        <SectionHead title="גיבוי" latin="BACKUP" />
        <div className="panel stack">
          <div
            className="cell-grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
          >
            <Cell
              label="גיבוי אחרון"
              value={backups[0] ? dateTime(backups[0].createdAt.toISOString()) : "עוד לא גובה"}
            />
            <Cell label="כמה נשמרו" value={<span className="num">{backups.length}</span>} />
            <Cell
              label="נפח"
              value={<span className="num">{(backupBytes / 1024 / 1024).toFixed(1)}MB</span>}
            />
          </div>

          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="quiet num" style={{ fontSize: 12, direction: "ltr" }}>
              {backupDir()}
            </span>
            <form action={runBackupAction}>
              <button className="btn btn-primary btn-sm" type="submit">
                גבה עכשיו
              </button>
            </form>
          </div>

          {offMachine ? (
            <div className="row">
              <Badge tone="good">הגיבוי יוצא מהמחשב</Badge>
              <span className="quiet" style={{ fontSize: 12.5 }}>
                תיקיית הגיבוי מוגדרת דרך BACKUP_DIR.
              </span>
            </div>
          ) : (
            <div className="panel-accent" style={{ padding: "12px 14px" }}>
              <span className="micro warn">הגיבוי לא עוזב את המחשב</span>
              <p style={{ fontSize: 13, marginTop: 4, lineHeight: 1.7 }}>
                הגיבויים נשמרים ליד קובץ המערכת. זה מגן מפני טעות, לא מפני דיסק
                שנשרף או מחשב שנגנב. הגדר <code>BACKUP_DIR</code> ב-<code>.env.local</code>{" "}
                לתיקייה מסונכרנת ב-Google Drive, והגיבוי יעזוב את המחשב מעצמו.
              </p>
            </div>
          )}

          {backups.length > 0 ? (
            <div className="table-scroll">
              <table className="data" style={{ minWidth: 320 }}>
                <thead>
                  <tr>
                    <th>קובץ</th>
                    <th>מתי</th>
                    <th>גודל</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.slice(0, 8).map((b) => (
                    <tr key={b.name}>
                      <td className="num muted">{b.name}</td>
                      <td className="num quiet">{dateTime(b.createdAt.toISOString())}</td>
                      <td className="num">{(b.bytes / 1024 / 1024).toFixed(1)}MB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <p className="quiet" style={{ fontSize: 12 }}>
            גיבוי רץ אוטומטית בעליית המערכת ואחת ליום. נשמרים שבעת האחרונים,
            ובנוסף אחד מכל חודש בשנה האחרונה. כל גיבוי נבדק בבדיקת שלמות לפני
            שהוא נשמר.
          </p>
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
