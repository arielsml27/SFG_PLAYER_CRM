/**
 * עטיפה מוטיפסת ללוגיקת הגיבוי. המימוש עצמו ב-backup-core.mjs, כדי
 * שסקריפט שורת הפקודה יריץ בדיוק את אותו קוד.
 */
import * as core from "./backup-core.mjs";

export type BackupFile = {
  name: string;
  fullPath: string;
  bytes: number;
  createdAt: Date;
};

export type BackupResult = {
  ok: boolean;
  file?: string;
  bytes?: number;
  removed?: string[];
  error?: string;
};

export const dbPath = core.dbPath as () => string;
export const backupDir = core.backupDir as () => string;
export const isOffMachine = core.isOffMachine as () => boolean;
export const listBackups = core.listBackups as () => BackupFile[];
export const lastBackup = core.lastBackup as () => BackupFile | null;
export const runBackup = core.runBackup as () => BackupResult;
export const backupIfDue = core.backupIfDue as (maxAgeHours?: number) => BackupResult | null;
