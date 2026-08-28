import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import path from "node:path";
import * as schema from "./schema";

// חיבור יחיד לקובץ SQLite מקומי (jewelry.db בשורש הפרויקט).
// משתמשים במודול המובנה node:sqlite כדי שהמערכת תרוץ בלי שום הורדת
// בינארי חיצוני — חשוב למחשב שלא תמיד מחובר לרשת.
declare global {
  var __samuelSqlite: DatabaseSync | undefined;
}

const dbPath = process.env.DATABASE_FILE || path.join(process.cwd(), "jewelry.db");

const sqlite = globalThis.__samuelSqlite ?? new DatabaseSync(dbPath);
if (process.env.NODE_ENV !== "production") {
  globalThis.__samuelSqlite = sqlite;
}

sqlite.exec("PRAGMA foreign_keys = ON;");

export const rawSqlite = sqlite;

export const db = drizzle(
  async (sqlText, params, method) => {
    try {
      const stmt = sqlite.prepare(sqlText);
      if (method === "run") {
        stmt.run(...params);
        return { rows: [] as unknown[] };
      }
      if (method === "get") {
        const row = stmt.get(...params);
        return { rows: row ? (Object.values(row) as unknown[]) : (undefined as never) };
      }
      const rows = stmt.all(...params).map((row) => Object.values(row as object));
      return { rows };
    } catch (err) {
      console.error("SQLite error:", err, sqlText, params);
      throw err;
    }
  },
  { schema }
);

export { schema };
