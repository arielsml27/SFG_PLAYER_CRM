// Creates (or updates the password of) an ADMIN CRM user. Run with:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... ADMIN_NAME="Your Name" node scripts/seed-admin.mjs
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { randomUUID, randomBytes, scryptSync } from "node:crypto";

const dbFile = process.env.DATABASE_FILE || path.join(process.cwd(), "dev.db");
const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";
const name = process.env.ADMIN_NAME || null;

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");

const db = new DatabaseSync(dbFile);
const now = new Date().toISOString();

const existing = db.prepare("SELECT id FROM crm_users WHERE email = ?").get(email);

if (existing) {
  db.prepare("UPDATE crm_users SET password_hash = ?, password_salt = ?, role = 'ADMIN', name = COALESCE(?, name), updated_at = ? WHERE id = ?")
    .run(hash, salt, name, now, existing.id);
  console.log(`Updated existing admin user: ${email}`);
} else {
  db.prepare(
    "INSERT INTO crm_users (id, email, name, password_hash, password_salt, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'ADMIN', ?, ?)"
  ).run(randomUUID(), email, name, hash, salt, now, now);
  console.log(`Created admin user: ${email}`);
}

db.close();
