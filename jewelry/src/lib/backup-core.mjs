// לוגיקת הגיבוי, ב-JS רגיל, כדי שגם המערכת וגם סקריפט שורת הפקודה
// ירוצו על אותו קוד בדיוק — ולא ייווצר מצב שאחד מנקה גיבויים ישנים והשני לא.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

export const KEEP_DAILY = 7;
export const KEEP_MONTHLY = 12;

export function dbPath() {
  return process.env.DATABASE_FILE || path.join(process.cwd(), "jewelry.db");
}

/**
 * BACKUP_DIR מאפשר להצביע על תיקייה מסונכרנת (Google Drive, OneDrive),
 * וכך הגיבוי עוזב את המחשב. בלעדיו הוא יושב ליד הקובץ המקורי —
 * מגן מפני טעות, לא מפני דיסק שנשרף.
 */
export function backupDir() {
  return process.env.BACKUP_DIR || path.join(process.cwd(), "backups");
}

export function isOffMachine() {
  return Boolean(process.env.BACKUP_DIR);
}

const NAME_RE = /^jewelry-\d{8}-\d{4}\.db$/;

export function listBackups() {
  const dir = backupDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => NAME_RE.test(f))
    .map((name) => {
      const fullPath = path.join(dir, name);
      const stat = fs.statSync(fullPath);
      return { name, fullPath, bytes: stat.size, createdAt: stat.mtime };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function lastBackup() {
  return listBackups()[0] ?? null;
}

function stamp(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

/** שומרים את 7 האחרונים, ובנוסף את החדש ביותר מכל אחד מ-12 החודשים האחרונים. */
export function prune() {
  const all = listBackups();
  const keep = new Set(all.slice(0, KEEP_DAILY).map((b) => b.name));

  const months = new Set();
  for (const b of all) {
    const key = `${b.createdAt.getFullYear()}-${b.createdAt.getMonth()}`;
    if (!months.has(key) && months.size < KEEP_MONTHLY) {
      months.add(key);
      keep.add(b.name);
    }
  }

  const removed = [];
  for (const b of all) {
    if (keep.has(b.name)) continue;
    try {
      fs.rmSync(b.fullPath);
      removed.push(b.name);
    } catch {
      // קובץ נעול או שנמחק כבר — לא סיבה להפיל גיבוי
    }
  }
  return removed;
}

/**
 * העתקה רגילה של קובץ SQLite בזמן שהשרת רץ עלולה לתפוס אותו באמצע כתיבה.
 * VACUUM INTO מייצר עותק עקבי של מסד חי, וגם דחוס יותר.
 */
export function runBackup() {
  const source = dbPath();
  if (!fs.existsSync(source)) return { ok: false, error: "קובץ המערכת לא נמצא" };

  const dir = backupDir();
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, `jewelry-${stamp(new Date())}.db`);

  try {
    if (fs.existsSync(target)) fs.rmSync(target);
    const db = new DatabaseSync(source, { readOnly: true });
    db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
    db.close();

    // גיבוי שווה משהו רק אם הוא נפתח ועובר בדיקת שלמות
    const check = new DatabaseSync(target, { readOnly: true });
    const verdict = check.prepare("PRAGMA integrity_check").get()?.integrity_check ?? "unknown";
    check.close();
    if (verdict !== "ok") {
      fs.rmSync(target);
      return { ok: false, error: `בדיקת השלמות נכשלה: ${verdict}` };
    }

    return {
      ok: true,
      file: path.basename(target),
      bytes: fs.statSync(target).size,
      removed: prune(),
    };
  } catch (err) {
    try {
      if (fs.existsSync(target)) fs.rmSync(target);
    } catch {
      // מתעלמים — כבר במסלול השגיאה
    }
    return { ok: false, error: err instanceof Error ? err.message : "שגיאה לא ידועה" };
  }
}

/** מגבה רק אם עבר מספיק זמן מהגיבוי האחרון. */
export function backupIfDue(maxAgeHours = 20) {
  const last = lastBackup();
  if (last && Date.now() - last.createdAt.getTime() < maxAgeHours * 3600_000) return null;
  return runBackup();
}
