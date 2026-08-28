// מכניס משתמש ראשון והגדרות התחלתיות.
// הרצה:  node scripts/seed.mjs [email] [password]
import { DatabaseSync } from "node:sqlite";
import { scryptSync, randomBytes, randomUUID } from "node:crypto";
import path from "node:path";

const dbFile = process.env.DATABASE_FILE || path.join(process.cwd(), "jewelry.db");
const email = (process.argv[2] || process.env.SEED_EMAIL || "samuel@local").toLowerCase();
const password = process.argv[3] || process.env.SEED_PASSWORD || "samuel";

function hashPassword(pw) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

const db = new DatabaseSync(dbFile);
const now = new Date().toISOString();

const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
if (existing) {
  db.prepare("UPDATE users SET password_hash = ? WHERE email = ?").run(hashPassword(password), email);
  console.log(`✓ הסיסמה של ${email} עודכנה`);
} else {
  db.prepare(
    "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(randomUUID(), email, "Samuel", hashPassword(password), now);
  console.log(`✓ נוצר משתמש ${email}`);
}

const settings = db.prepare("SELECT id FROM settings WHERE id = 'singleton'").get();
if (!settings) {
  db.prepare(
    `INSERT INTO settings (id, gold_spot_usd_oz, fx_usd_ils, vat_pct, default_multiplier,
       default_deposit_pct, business_name, updated_at)
     VALUES ('singleton', 0, 0, 18, 2, 30, 'Samuel', ?)`
  ).run(now);
  console.log("✓ נוצרו הגדרות ברירת מחדל — עדכן שער זהב ודולר במסך ההגדרות");
}

db.close();
console.log(`\nהתחברות:  ${email}  /  ${password}`);
console.log("שנה סיסמה בהרצה חוזרת:  node scripts/seed.mjs email סיסמה-חדשה");
