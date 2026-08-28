// Applies all SQL migration files in ./drizzle to the local SQLite database.
// Run with: node scripts/migrate.mjs
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const dbFile = process.env.DATABASE_FILE || path.join(process.cwd(), "jewelry.db");
const migrationsDir = path.join(process.cwd(), "drizzle");

const db = new DatabaseSync(dbFile);
db.exec(`
  CREATE TABLE IF NOT EXISTS __migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (current_timestamp)
  );
`);

const applied = new Set(
  db.prepare("SELECT name FROM __migrations").all().map((r) => r.name)
);

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let count = 0;
for (const file of files) {
  if (applied.has(file)) continue;
  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  db.exec("BEGIN");
  try {
    for (const stmt of statements) db.exec(stmt);
    db.prepare("INSERT INTO __migrations (name) VALUES (?)").run(file);
    db.exec("COMMIT");
    console.log(`✓ applied ${file}`);
    count++;
  } catch (err) {
    db.exec("ROLLBACK");
    console.error(`✗ failed ${file}:`, err.message);
    process.exit(1);
  }
}

if (count === 0) {
  console.log("No new migrations. Database is up to date:", dbFile);
} else {
  console.log(`Applied ${count} migration(s) to ${dbFile}`);
}
db.close();
