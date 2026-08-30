/**
 * בדיקות שפיות וגיבוי אוטומטי. רצות פעם אחת, בעליית השרת.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // בזמן build אין שרת ואין מה לגבות
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { isUsingFallbackSecret } = await import("@/lib/auth");

  if (isUsingFallbackSecret()) {
    const message = [
      "",
      "  APP_SECRET לא הוגדר.",
      "",
      "  הסוד הזה חותם את עוגיית הסשן. בלעדיו המערכת משתמשת בסוד שכתוב בקוד,",
      "  וכל מי שראה את הקוד יכול לזייף כניסה. זה מקובל רק בפיתוח מקומי.",
      "",
      "  ליצירת סוד:  node scripts/setup-secret.mjs",
      "",
    ].join("\n");

    if (process.env.NODE_ENV === "production") {
      console.error(message);
      throw new Error("APP_SECRET חסר — סירוב לעלות במצב production");
    }
    console.warn(message);
  }

  // גיבוי: פעם בעלייה אם עבר יום, ואז אחת ליום כל עוד השרת חי.
  const { backupIfDue, isOffMachine } = await import("@/lib/backup");

  const tick = () => {
    try {
      const result = backupIfDue(20);
      if (result?.ok) {
        console.log(`✓ גיבוי: ${result.file}`);
        if (result.removed?.length) console.log(`  נוקו ${result.removed.length} גיבויים ישנים`);
      } else if (result && !result.ok) {
        console.error(`✗ הגיבוי נכשל: ${result.error}`);
      }
    } catch (err) {
      console.error("✗ הגיבוי נכשל:", err);
    }
  };

  tick();
  const timer = setInterval(tick, 6 * 3600_000);
  // לא מחזיק את התהליך בחיים בגלל הטיימר
  if (typeof timer.unref === "function") timer.unref();

  if (!isOffMachine()) {
    console.warn(
      "  הגיבוי נשמר ליד קובץ המערכת. להגנה אמיתית הגדר BACKUP_DIR לתיקייה מסונכרנת."
    );
  }
}
