// יוצר APP_SECRET ושומר אותו ב-.env.local, אם עוד אין.
// הרצה:  node scripts/setup-secret.mjs
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");
const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

if (/^APP_SECRET=.+/m.test(existing)) {
  console.log("APP_SECRET כבר קיים ב-.env.local — לא נגעתי בו.");
  process.exit(0);
}

const secret = randomBytes(48).toString("base64url");
const line = `APP_SECRET=${secret}\n`;
fs.writeFileSync(envPath, existing ? `${existing.replace(/\n*$/, "\n")}${line}` : line);

console.log("✓ נוצר APP_SECRET ונשמר ב-.env.local");
console.log("  אל תשתף את הקובץ הזה ואל תעלה אותו לגיט.");
console.log("  שינוי הסוד ינתק אותך מהמערכת ותצטרך להיכנס מחדש.");
