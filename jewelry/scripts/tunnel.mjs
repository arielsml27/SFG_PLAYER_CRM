// מקים מנהרה שמחשׂפת את המערכת המקומית לאינטרנט, ומעדכן את כתובת
// הבסיס בהגדרות כדי שלינקי השיתוף ייבנו נכון.
//
//   node scripts/tunnel.mjs
//
// מצב יציב (מומלץ): הגדר TUNNEL_HOSTNAME לדומיין קבוע שלך, והסקריפט
// ישתמש בו במקום בכתובת אקראית.
import { spawn } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const PORT = process.env.PORT || "3000";
const dbFile = process.env.DATABASE_FILE || path.join(process.cwd(), "jewelry.db");
const stableHost = process.env.TUNNEL_HOSTNAME;

function saveBaseUrl(url) {
  if (!fs.existsSync(dbFile)) {
    console.warn(`  (לא נמצא ${dbFile} — הכתובת לא נשמרה בהגדרות)`);
    return;
  }
  const db = new DatabaseSync(dbFile);
  const row = db.prepare("SELECT id FROM settings WHERE id = 'singleton'").get();
  if (row) {
    db.prepare("UPDATE settings SET public_base_url = ?, updated_at = ? WHERE id = 'singleton'").run(
      url,
      new Date().toISOString()
    );
    console.log("✓ כתובת הבסיס עודכנה בהגדרות");
  }
  db.close();
}

function banner(url) {
  console.log("");
  console.log("  ─────────────────────────────────────────────");
  console.log(`  המערכת נגישה בכתובת:  ${url}`);
  console.log("  ─────────────────────────────────────────────");
  console.log("");
  console.log("  לינקי שיתוף ייבנו מהכתובת הזו החל מעכשיו.");
  if (!stableHost) {
    console.log("");
    console.log("  שים לב: זו כתובת זמנית. בסגירת החלון היא מתה,");
    console.log("  ובהפעלה הבאה תתקבל כתובת אחרת — ולינקים שכבר שלחת יפסיקו לעבוד.");
    console.log("  לכתובת קבועה: מנהרה בשם עם דומיין שלך, והגדרת TUNNEL_HOSTNAME.");
  }
  console.log("");
}

if (stableHost) {
  const url = stableHost.startsWith("http") ? stableHost : `https://${stableHost}`;
  saveBaseUrl(url.replace(/\/+$/, ""));
  banner(url);
  console.log("  הרץ את המנהרה הקבועה שלך בנפרד:  cloudflared tunnel run <שם>");
  process.exit(0);
}

console.log(`מקים מנהרה אל http://localhost:${PORT} …`);

const child = spawn("cloudflared", ["tunnel", "--url", `http://localhost:${PORT}`], {
  stdio: ["ignore", "pipe", "pipe"],
});

child.on("error", (err) => {
  if (err.code === "ENOENT") {
    console.error("");
    console.error("  cloudflared לא מותקן.");
    console.error("");
    console.error("  Windows:  winget install --id Cloudflare.cloudflared");
    console.error("  macOS:    brew install cloudflared");
    console.error("");
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});

let announced = false;
const watch = (chunk) => {
  const text = chunk.toString();
  process.stderr.write(text);
  const match = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/i.exec(text);
  if (match && !announced) {
    announced = true;
    saveBaseUrl(match[0]);
    banner(match[0]);
  }
};

child.stdout.on("data", watch);
child.stderr.on("data", watch);

const stop = () => {
  child.kill("SIGINT");
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
