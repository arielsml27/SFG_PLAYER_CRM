import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import path from "node:path";
import * as schema from "./schema";

// Single shared connection to the local SQLite file (dev.db in project root).
// We use Node's built-in `node:sqlite` module so the whole app runs with
// zero native-binary downloads and zero external dependencies at runtime -
// important for a CRM that must "just work" on a local machine.
declare global {
  // eslint-disable-next-line no-var
  var __sfgSqlite: DatabaseSync | undefined;
}

const dbPath = process.env.DATABASE_FILE || path.join(process.cwd(), "dev.db");

const sqlite = globalThis.__sfgSqlite ?? new DatabaseSync(dbPath);
if (process.env.NODE_ENV !== "production") {
  globalThis.__sfgSqlite = sqlite;
}

sqlite.exec("PRAGMA foreign_keys = ON;");

export const rawSqlite = sqlite;

export const db = drizzle(
  async (sqlText, params, method) => {
    try {
      const stmt = sqlite.prepare(sqlText);
      if (method === "run") {
        stmt.run(...params);
        return { rows: [] as any[] };
      }
      if (method === "get") {
        const row = stmt.get(...params);
        return { rows: row ? (Object.values(row) as any[]) : (undefined as any) };
      }
      // "all" and "values"
      const rows = stmt.all(...params).map((row: any) => Object.values(row));
      return { rows };
    } catch (err) {
      console.error("SQLite error:", err, sqlText, params);
      throw err;
    }
  },
  { schema }
);

export { schema };
