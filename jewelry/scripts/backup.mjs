// גיבוי ידני או מתוזמן.
//   node scripts/backup.mjs
// לתיקייה מסונכרנת (מומלץ):
//   BACKUP_DIR="G:\\האחסון שלי\\Samuel Backups" node scripts/backup.mjs
import { runBackup, backupDir, isOffMachine } from "../src/lib/backup-core.mjs";

const result = runBackup();

if (!result.ok) {
  console.error(`✗ הגיבוי נכשל: ${result.error}`);
  process.exit(1);
}

console.log(`✓ ${result.file} · ${(result.bytes / 1024 / 1024).toFixed(1)}MB · ${backupDir()}`);
if (result.removed.length) console.log(`  נוקו ${result.removed.length} גיבויים ישנים`);
if (!isOffMachine()) {
  console.log("  הגיבוי לא עוזב את המחשב. הגדר BACKUP_DIR לתיקייה מסונכרנת.");
}
