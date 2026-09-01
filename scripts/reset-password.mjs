// Resets (or creates) a CRM login for a given email.
// Usage:  node scripts/reset-password.mjs someone@email.com NewPassword123
import { DatabaseSync } from "node:sqlite";
import { randomBytes, scryptSync, randomUUID } from "node:crypto";

const [, , email, newPassword] = process.argv;
if (!email || !newPassword) {
  console.error("Usage: node scripts/reset-password.mjs <email> <newPassword>");
  process.exit(1);
}

const dbFile = process.env.DATABASE_FILE || "./dev.db";
const db = new DatabaseSync(dbFile);

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

const normalizedEmail = email.trim().toLowerCase();
const { hash, salt } = hashPassword(newPassword);

const existing = db.prepare("SELECT id FROM crm_users WHERE email = ?").get(normalizedEmail);

if (existing) {
  db.prepare("UPDATE crm_users SET password_hash = ?, password_salt = ? WHERE id = ?").run(
    hash,
    salt,
    existing.id
  );
  console.log(`✓ Password updated for existing user: ${normalizedEmail}`);
} else {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO crm_users (id, email, name, password_hash, password_salt, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, normalizedEmail, null, hash, salt, "ADMIN", now, now);
  console.log(`✓ New ADMIN user created: ${normalizedEmail}`);
}

db.close();
